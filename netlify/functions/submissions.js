const { neon } = require("@netlify/neon");

const sql = neon();

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS submissions (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      payload JSONB NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

exports.handler = async (event) => {
  await ensureSchema();

  if (event.httpMethod === "GET") {
    const rows = await sql`
      SELECT id, type, payload, submitted_at
      FROM submissions
      ORDER BY submitted_at DESC
      LIMIT 200
    `;
    const result = rows.map((row) => ({
      id: row.id,
      type: row.type,
      values: row.payload,
      submittedAt: row.submitted_at,
    }));
    return { statusCode: 200, body: JSON.stringify(result) };
  }

  if (event.httpMethod === "POST") {
    const payload = JSON.parse(event.body || "{}");
    await sql`
      INSERT INTO submissions (type, payload, submitted_at)
      VALUES (${payload.type || "Unknown"}, ${payload.values || {}}, NOW())
    `;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod === "DELETE") {
    await sql`TRUNCATE TABLE submissions`;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
