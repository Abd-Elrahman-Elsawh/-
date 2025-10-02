// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const prompt = req.body?.prompt;
  if (!prompt) return res.status(400).json({ error: "prompt is required" });

  const API_KEY = process.env.GOOGLE_API_KEY;
  const ENDPOINT = process.env.GEMINI_ENDPOINT; // مثال: https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate
  // يمكنك بدلاً من ذلك استخدام MODEL_NAME مع قالب endpoint مخصص في حال احتجت

  if (!API_KEY || !ENDPOINT) {
    return res.status(500).json({ error: "Server not configured. Set GOOGLE_API_KEY and GEMINI_ENDPOINT" });
  }

  try {
    const body = {
      // شكل الجسم قابل للتعديل حسب واجهة Gemini الفعلية.
      // هذا مثال عام لإرسال نص واحد. عدّله إذا مستندات Google تختلف.
      prompt: {
        text: prompt
      },
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

    const data = await r.text(); // نحفظ النص الخام إن اختلف الشكل
    let json;
    try { json = JSON.parse(data); } catch { json = { raw: data }; }

    if (!r.ok) {
      return res.status(r.status).json({ error: "Remote API error", details: json });
    }

    // حاول استخراج النص من بنية الاستجابة الشائعة. عدّل حسب استجابة Gemini الحقيقية:
    let text = "";
    if (json && json.candidates && Array.isArray(json.candidates)) {
      text = json.candidates.map(c => c.content?.[0]?.text || c.output || c).join("\n");
    } else if (json?.outputs && Array.isArray(json.outputs)) {
      text = json.outputs.map(o => o.text || JSON.stringify(o)).join("\n");
    } else if (json?.text) {
      text = json.text;
    } else if (json.raw) {
      text = json.raw;
    }

    return res.status(200).json({ ok: true, result: text, raw: json });
  } catch (err) {
    console.error("Gemini proxy error:", err);
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
