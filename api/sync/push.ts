import type { VercelRequest, VercelResponse } from "@vercel/node";
import { auth } from "../_lib/auth.js";
import { neonDatabasePool, ensureEncryptedVaultTableExists } from "../_lib/db.js";

interface EncryptedPushRequestBody {
  documentId: string;
  documentNumber: string;
  documentType: "INVOICE" | "ESTIMATE";
  version: number;
  encryptedPayloadBase64: string;
  checksumSha256: string;
}

export default async function handleEncryptedPush(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 1. Authenticate user via Better Auth session headers
    const session = await auth.api.getSession({
      headers: request.headers as unknown as Headers,
    });

    if (!session || !session.user) {
      return response.status(401).json({ error: "Unauthorized. Contractor login required." });
    }

    const userId = session.user.id;
    const requestBody = request.body as EncryptedPushRequestBody;

    if (
      !requestBody.documentId ||
      !requestBody.encryptedPayloadBase64 ||
      !requestBody.checksumSha256
    ) {
      return response.status(400).json({ error: "Missing required encrypted document fields." });
    }

    // Ensure database table exists
    await ensureEncryptedVaultTableExists();

    const recordId = `${userId}_${requestBody.documentId}`;
    const client = await neonDatabasePool.connect();

    try {
      await client.query(
        `
        INSERT INTO encrypted_contractor_documents (
          id, user_id, document_id, document_number, document_type, version, encrypted_payload_base64, checksum_sha256, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW()
        )
        ON CONFLICT (user_id, document_id) DO UPDATE SET
          version = EXCLUDED.version,
          document_number = EXCLUDED.document_number,
          document_type = EXCLUDED.document_type,
          encrypted_payload_base64 = EXCLUDED.encrypted_payload_base64,
          checksum_sha256 = EXCLUDED.checksum_sha256,
          updated_at = NOW();
      `,
        [
          recordId,
          userId,
          requestBody.documentId,
          requestBody.documentNumber || "DOC-001",
          requestBody.documentType || "INVOICE",
          requestBody.version || 1,
          requestBody.encryptedPayloadBase64,
          requestBody.checksumSha256,
        ]
      );

      return response.status(200).json({
        success: true,
        documentId: requestBody.documentId,
        syncedAt: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to push encrypted document to Neon:", error);
    return response.status(500).json({ error: "Internal server error during cloud sync." });
  }
}
