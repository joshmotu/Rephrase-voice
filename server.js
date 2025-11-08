const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Set it in Replit Secrets or .env');
}

app.post('/rephrase', async (req, res) => {
  try {
    const { text, tone } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });

    const system =
      "You are a helpful assistant. Rephrase the user's input while preserving meaning. " +
      "Respect the requested tone if provided (e.g., Friendly, Formal, Funny, Simple). " +
      "Keep output concise and natural.";

    let userMessage = `Rephrase the following text preserving meaning: "${text}"`;
    if (tone) userMessage += ` Use a "${tone}" tone.`;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage }
      ],
      temperature: 0.8,
      max_tokens: 200
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const textErr = await resp.text();
      return res.status(500).json({ error: 'OpenAI error', detail: textErr });
    }

    const data = await resp.json();
    const returned =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      "";

    res.json({ rephrased: returned.trim() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
