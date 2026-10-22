import type { InvoiceEstimateDocument, VaultEncryptionPayload } from "@/domain/types";
import {
  encryptInvoiceDocument,
  decryptInvoiceDocument,
} from "./vault-crypto-service";
import {
  loadAllDocumentsFromRepository,
  saveDocumentToRepository,
} from "./indexeddb-repository";

export interface RemoteEncryptedDocumentRecord {
  documentId: string;
  documentNumber: string;
  documentType: "INVOICE" | "ESTIMATE";
  version: number;
  encryptedPayloadBase64: string;
  checksumSha256: string;
  updatedAt: string;
}

export interface CloudSyncResult {
  successfulPushes: number;
  successfulPulls: number;
  errors: string[];
}

/**
 * Computes SHA-256 checksum of raw ciphertext string for integrity verification.
 */
async function computeSha256Checksum(rawString: string): Promise<string> {
  const textEncoder = new TextEncoder();
  const textBytes = textEncoder.encode(rawString);
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", textBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Pushes an individual invoice/estimate document to the serverless Neon sync endpoint.
 * Zero-Knowledge Guarantee: Encrypts document into an opaque AES-GCM-256 blob before network dispatch.
 */
export async function pushEncryptedDocumentToCloud(
  invoiceDocument: InvoiceEstimateDocument,
  encryptionPasscode: string
): Promise<{ success: boolean; documentId: string }> {
  // 1. Client-side hardware-accelerated encryption
  const encryptedPayload: VaultEncryptionPayload = await encryptInvoiceDocument(
    invoiceDocument,
    encryptionPasscode
  );

  // 2. Compute integrity checksum of the ciphertext
  const checksumSha256 = await computeSha256Checksum(encryptedPayload.ciphertextBase64);

  // 3. Serialize encrypted payload envelope to Base64
  const serializedPayloadJson = JSON.stringify(encryptedPayload);
  const encryptedPayloadBase64 = btoa(serializedPayloadJson);

  // 4. Dispatch over HTTPS to serverless sync endpoint
  const syncResponse = await fetch("/api/sync/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId: invoiceDocument.id,
      documentNumber: invoiceDocument.documentNumber,
      documentType: invoiceDocument.documentType,
      version: 1,
      encryptedPayloadBase64,
      checksumSha256,
    }),
  });

  if (!syncResponse.ok) {
    const errorDetails = await syncResponse.text().catch(() => "Sync push failed");
    throw new Error(`Sync Push Failed (${syncResponse.status}): ${errorDetails}`);
  }

  return { success: true, documentId: invoiceDocument.id };
}

/**
 * Pulls all encrypted document blobs from Neon and decrypts them locally into IndexedDB.
 * Requires the contractor's Master Passcode to decrypt.
 */
export async function pullAndDecryptDocumentsFromCloud(
  decryptionPasscode: string
): Promise<{ decryptedCount: number; documents: InvoiceEstimateDocument[] }> {
  const pullResponse = await fetch("/api/sync/pull", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!pullResponse.ok) {
    const errorDetails = await pullResponse.text().catch(() => "Sync pull failed");
    throw new Error(`Sync Pull Failed (${pullResponse.status}): ${errorDetails}`);
  }

  const responseJson = (await pullResponse.json()) as {
    documents: RemoteEncryptedDocumentRecord[];
  };

  const remoteDocuments = responseJson.documents || [];
  const decryptedDocuments: InvoiceEstimateDocument[] = [];

  for (const remoteRecord of remoteDocuments) {
    try {
      // 1. Decode serialized vault payload
      const deserializedJson = atob(remoteRecord.encryptedPayloadBase64);
      const encryptedVaultPayload = JSON.parse(deserializedJson) as VaultEncryptionPayload;

      // 2. Client-side local decryption
      const decryptedDocument = await decryptInvoiceDocument(
        encryptedVaultPayload,
        decryptionPasscode
      );

      // 3. Save to local-first IndexedDB
      await saveDocumentToRepository(decryptedDocument);
      decryptedDocuments.push(decryptedDocument);
    } catch (decryptionError) {
      console.warn(
        `Failed to decrypt cloud document ${remoteRecord.documentNumber}:`,
        decryptionError
      );
    }
  }

  return {
    decryptedCount: decryptedDocuments.length,
    documents: decryptedDocuments,
  };
}

/**
 * Synchronizes all local offline documents to the cloud serverless endpoint.
 */
export async function syncAllLocalDocumentsToCloud(
  encryptionPasscode: string
): Promise<CloudSyncResult> {
  const localDocuments = await loadAllDocumentsFromRepository();
  let successfulPushes = 0;
  const syncErrors: string[] = [];

  for (const document of localDocuments) {
    try {
      await pushEncryptedDocumentToCloud(document, encryptionPasscode);
      successfulPushes += 1;
    } catch (pushError) {
      const errorMessage =
        pushError instanceof Error ? pushError.message : "Unknown push failure";
      syncErrors.push(`${document.documentNumber}: ${errorMessage}`);
    }
  }

  return {
    successfulPushes,
    successfulPulls: 0,
    errors: syncErrors,
  };
}
