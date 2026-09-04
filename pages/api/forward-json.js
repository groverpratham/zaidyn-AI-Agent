// Placeholder endpoint for step 2 of the workflow: once you share the
// downstream app's API spec, this is the only file that needs updating —
// the frontend already calls it via the "Send to Pipeline" button.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed." });
  }

  const { json } = req.body || {};
  const url = process.env.DOWNSTREAM_API_URL;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "DOWNSTREAM_API_URL isn't configured yet.",
    });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.DOWNSTREAM_API_KEY
          ? { Authorization: `Bearer ${process.env.DOWNSTREAM_API_KEY}` }
          : {}),
      },
      body: JSON.stringify(json),
    });

    const result = await response.json().catch(() => ({}));
    return res.status(response.status).json({ success: response.ok, result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
