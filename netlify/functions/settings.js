const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore("kkroy");

  if (event.httpMethod === "GET") {
    const settings = await store.get("settings", { type: "json" });
    return {
      statusCode: 200,
      body: JSON.stringify(settings || {}),
    };
  }

  if (event.httpMethod === "POST") {
    const payload = JSON.parse(event.body || "{}");
    await store.set("settings", payload, { type: "json" });
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  }

  return {
    statusCode: 405,
    body: "Method Not Allowed",
  };
};
