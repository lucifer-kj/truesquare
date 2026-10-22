import type { VercelRequest, VercelResponse } from "@vercel/node";
import { auth } from "../_lib/auth.js";
import { neonDatabasePool, ensureEncryptedVaultTableExists } from "../_lib/db.js";

interface EncryptedDocumentRecord {
  id: string;
  user_id: string;
  document_id: string;
  document_number: string;
  document_type: "INVOICE" | "ESTIMATE";
  version: number;
  encrypted_payload_base64: string;
  checksum_sha256: string;
  updated_at: string;
}

export default async function handleEncryptedPull(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
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

    // Ensure database table exists
    await ensureEncryptedVaultTableExists();

    const client = await neonDatabasePool.connect();

    try {
      const queryResult = await client.query<EncryptedDocumentRecord>(
        `
        SELECT 
          document_id AS "documentId",
          document_number AS "documentNumber",
          document_type AS "documentType",
          version,
          encrypted_payload_base64 AS "encryptedPayloadBase64",
          checksum_sha256 AS "checksumSha256",
          updated_at AS "updatedAt"
        FROM encrypted_contractor_documents
        WHERE user_id = $1
        ORDER BY updated_at DESC;
      `,
        [userId]
      );

      return response.status(200).json({
        success: true,
        documents: queryResult.rows,
        totalCount: queryResult.rowCount ?? 0,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to pull encrypted documents from Neon:", error);
    return response.status(500).json({ error: "Internal server error during cloud sync pull." });
  }
}
