import express from "express";
import fetch from "node-fetch"; // إذا Node < 18 استخدم node-fetch
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// السماح بالطلبات من أي دومين (يمكن تضييقها لاحقاً)
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = "sk-or-XXXXXXX"; // ضع مفتاحك هنا
const OPENROUTER_MODEL = "google/gemini-2.5-flash";

app.post("/api/openrouter", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("OpenRouter Proxy Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
