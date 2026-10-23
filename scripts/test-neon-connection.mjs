import { Pool } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required to test the connection.");
  process.exit(1);
}

async function main() {
  console.log("Connecting to Neon PostgreSQL...");
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  console.log("✅ Successfully connected to Neon!");

  const serverInfo = await client.query("SELECT NOW() as current_time, version();");
  console.log("Neon Server Time:", serverInfo.rows[0].current_time);
  console.log("PostgreSQL Version:", serverInfo.rows[0].version);

  console.log("Migrating encrypted_contractor_documents table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS encrypted_contractor_documents (
      id VARCHAR(128) PRIMARY KEY,
      user_id VARCHAR(128) NOT NULL,
      document_id VARCHAR(128) NOT NULL,
      document_number VARCHAR(64) NOT NULL,
      document_type VARCHAR(32) NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      encrypted_payload_base64 TEXT NOT NULL,
      checksum_sha256 VARCHAR(64) NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, document_id)
    );
    CREATE INDEX IF NOT EXISTS idx_contractor_docs_user ON encrypted_contractor_documents(user_id);
  `);
  console.log("✅ Table encrypted_contractor_documents is verified and active!");

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';");
  console.log("Public tables currently in Neon database:", tables.rows.map((r) => r.table_name));

  client.release();
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Neon connection error:", err);
  process.exit(1);
});
