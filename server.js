// server.js
import express from "express";
import cors from "cors";

const app = express();
app.use(cors()); // ضيق الوصول لاحقاً لو حبيت
app.use(express.json());

const API_KEY = process.env.GOOGLE_API_KEY;
const ENDPOINT = process.env.GEMINI_ENDPOINT;

app.post("/api/gemini", async (req, res) => {
  const prompt = req.body?.prompt;
  if (!prompt) return res.status(400).json({ error: "prompt required" });
  if (!API_KEY || !ENDPOINT) return res.status(500).json({ error: "server not configured" });

  try {
    const body = {
      prompt: { text: prompt },
      temperature: 0.7,
      maxOutputTokens: 800
    };

    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    if (!r.ok) return res.status(r.status).json({ error: "remote error", details: json });

    // استخرج النص كما في المثال أعلاه
    let result = "";
    if (json?.candidates) result = (json.candidates.map(c => c.output || c.content?.[0]?.text || JSON.stringify(c))).join("\n");
    else if (json?.outputs) result = json.outputs.map(o => o.text || JSON.stringify(o)).join("\n");
    else if (json?.text) result = json.text;
    else result = JSON.stringify(json);

    res.json({ ok: true, result, raw: json });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error", details: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
