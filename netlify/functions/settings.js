const { neon } = require("@netlify/neon");

const sql = neon();

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

exports.handler = async (event) => {
  await ensureSchema();

  if (event.httpMethod === "GET") {
    const rows = await sql`SELECT payload FROM settings WHERE id = 1`;
    return { statusCode: 200, body: JSON.stringify(rows[0]?.payload || {}) };
  }

  if (event.httpMethod === "POST") {
    const payload = JSON.parse(event.body || "{}");
    await sql`
      INSERT INTO settings (id, payload, updated_at)
      VALUES (1, ${payload}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET payload = EXCLUDED.payload,
          updated_at = NOW()
    `;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
