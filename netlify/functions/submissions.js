const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const store = getStore("kkroy");

  if (event.httpMethod === "GET") {
    const submissions = await store.get("submissions", { type: "json" });
    return {
      statusCode: 200,
      body: JSON.stringify(submissions || []),
    };
  }

  if (event.httpMethod === "POST") {
    const payload = JSON.parse(event.body || "{}");
    const submissions = (await store.get("submissions", { type: "json" })) || [];
    submissions.unshift({
      id: Date.now(),
      ...payload,
    });
    await store.set("submissions", submissions.slice(0, 200), { type: "json" });
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  }

  if (event.httpMethod === "DELETE") {
    await store.set("submissions", [], { type: "json" });
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
