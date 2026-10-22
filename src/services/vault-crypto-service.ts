import type { InvoiceEstimateDocument, VaultEncryptionPayload } from "@/domain/types";
import { InvoiceEstimateDocumentSchema, VaultEncryptionPayloadSchema } from "@/domain/schemas";

const PBKDF2_ITERATION_COUNT = 100_000;
const AES_KEY_BIT_LENGTH = 256;
const INITIALIZATION_VECTOR_BYTE_LENGTH = 12; // 96 bits recommended for AES-GCM
const SALT_BYTE_LENGTH = 16;

/**
 * Base64 Encoding and Decoding Utilities for WebCrypto Binary Buffers
 */
export function convertBufferToBase64(binaryBuffer: ArrayBuffer | Uint8Array): string {
  const byteView = binaryBuffer instanceof Uint8Array ? binaryBuffer : new Uint8Array(binaryBuffer);
  let binaryString = "";
  for (let byteIndex = 0; byteIndex < byteView.byteLength; byteIndex++) {
    binaryString += String.fromCharCode(byteView[byteIndex]);
  }
  return btoa(binaryString);
}

export function convertBase64ToBuffer(base64String: string): Uint8Array {
  const binaryString = atob(base64String);
  const binaryBuffer = new Uint8Array(binaryString.length);
  for (let charIndex = 0; charIndex < binaryString.length; charIndex++) {
    binaryBuffer[charIndex] = binaryString.charCodeAt(charIndex);
  }
  return binaryBuffer;
}

/**
 * Derives a hardware-accelerated 256-bit AES-GCM encryption key from a user passcode and salt.
 */
export async function deriveAesGcmKeyFromPasscode(
  userPasscode: string,
  cryptographicSalt: Uint8Array
): Promise<CryptoKey> {
  const textEncoder = new TextEncoder();
  const encodedPasscodeBytes = textEncoder.encode(userPasscode);

  const baseKeyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    encodedPasscodeBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: cryptographicSalt as unknown as BufferSource,
      iterations: PBKDF2_ITERATION_COUNT,
      hash: "SHA-256",
    },
    baseKeyMaterial,
    {
      name: "AES-GCM",
      length: AES_KEY_BIT_LENGTH,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts arbitrary plaintext string using AES-GCM 256-bit encryption.
 */
export async function encryptPlaintextPayload(
  rawPlaintextContent: string,
  userPasscode: string
): Promise<VaultEncryptionPayload> {
  const cryptographicSalt = new Uint8Array(SALT_BYTE_LENGTH);
  globalThis.crypto.getRandomValues(cryptographicSalt);

  const initializationVector = new Uint8Array(INITIALIZATION_VECTOR_BYTE_LENGTH);
  globalThis.crypto.getRandomValues(initializationVector);

  const derivedAesKey = await deriveAesGcmKeyFromPasscode(userPasscode, cryptographicSalt);

  const textEncoder = new TextEncoder();
  const plaintextBytes = textEncoder.encode(rawPlaintextContent);

  const encryptedCiphertextBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: initializationVector,
    },
    derivedAesKey,
    plaintextBytes
  );

  return {
    ciphertextBase64: convertBufferToBase64(encryptedCiphertextBuffer),
    initializationVectorBase64: convertBufferToBase64(initializationVector),
    saltBase64: convertBufferToBase64(cryptographicSalt),
    algorithm: "AES-GCM-256",
    version: 1,
  };
}

/**
 * Decrypts an AES-GCM 256-bit encrypted payload back into a plaintext string.
 */
export async function decryptCiphertextPayload(
  encryptedPayload: VaultEncryptionPayload,
  userPasscode: string
): Promise<string> {
  const payloadValidationResult = VaultEncryptionPayloadSchema.safeParse(encryptedPayload);
  if (!payloadValidationResult.success) {
    throw new Error("Invalid cryptographic vault payload format.");
  }

  const cryptographicSalt = convertBase64ToBuffer(encryptedPayload.saltBase64);
  const initializationVector = convertBase64ToBuffer(encryptedPayload.initializationVectorBase64);
  const ciphertextBuffer = convertBase64ToBuffer(encryptedPayload.ciphertextBase64);

  const derivedAesKey = await deriveAesGcmKeyFromPasscode(userPasscode, cryptographicSalt);

  try {
    const decryptedPlaintextBuffer = await globalThis.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: initializationVector as unknown as BufferSource,
      },
      derivedAesKey,
      ciphertextBuffer as unknown as BufferSource
    );

    const textDecoder = new TextDecoder();
    return textDecoder.decode(decryptedPlaintextBuffer);
  } catch (decryptionError) {
    throw new Error("Decryption failed. Incorrect passcode or corrupted ciphertext.");
  }
}

/**
 * High-level helper: Encrypts a full contractor invoice document.
 */
export async function encryptInvoiceDocument(
  invoiceDocument: InvoiceEstimateDocument,
  userPasscode: string
): Promise<VaultEncryptionPayload> {
  const serializedDocumentJson = JSON.stringify(invoiceDocument);
  return encryptPlaintextPayload(serializedDocumentJson, userPasscode);
}

/**
 * High-level helper: Decrypts and validates a full contractor invoice document.
 */
export async function decryptInvoiceDocument(
  encryptedPayload: VaultEncryptionPayload,
  userPasscode: string
): Promise<InvoiceEstimateDocument> {
  const decryptedJsonString = await decryptCiphertextPayload(encryptedPayload, userPasscode);
  const parsedDocumentRecord = JSON.parse(decryptedJsonString);
  const validatedDocumentResult = InvoiceEstimateDocumentSchema.safeParse(parsedDocumentRecord);

  if (!validatedDocumentResult.success) {
    throw new Error("Decrypted payload failed invoice schema validation.");
  }

  return validatedDocumentResult.data;
}
