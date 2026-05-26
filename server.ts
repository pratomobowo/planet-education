import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json());

// Initialize Gemini Client with named parameters and aistudio-build telemetry
let ai: GoogleGenAI | null = null;
const getGeminiClient = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
};

// AI Space Guide Proxy Route
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const client = getGeminiClient();
    
    // Construct rich system prompt for the virtual astronomer
    const systemInstruction = 
      "Anda adalah 'Astro-Guide', asisten AI pemandu astronomi virtual interaktif yang cerdas, ramah, dan penuh dengan pengetahun luar angkasa. " +
      "Tugas Anda adalah mendidik pengguna (khususnya pelajar dan pencinta luar angkasa) mengenai tata surya kita, galaksi Bima Sakti, planet-planet, gravitasi, bintang-bintang, " +
      "dan misteri alam semesta. Berikan jawaban yang membakar rasa ingin tahu, mendalam namun mudah dipahami, bernada antusias, edukatif, dan sertakan analogi menarik jika dimungkinkan. " +
      "Gunakan Bahasa Indonesia yang baik, santun, dan interaktif. Batasi jawaban Anda maksimal 3-4 paragraf agar tidak terlalu padat dan tetap enak dibaca di dalam panel chat melayang.";

    // Match instructions for chats
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Generate content using Gemini 3.5 Flash
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    const replyText = response.text || 'Maaf, saya sedang mengalami gangguan sinyal kosmik dari sabuk asteroid. Bisakah Anda mengulangi pertanyaan Anda?';
    res.json({ reply: replyText });
  } catch (err: any) {
    console.error('Error in Gemini Chat API:', err);
    res.status(500).json({ 
      error: 'Terjadi kegagalan komunikasi dengan Teleskop Informasi Gemini AI.', 
      details: err.message 
    });
  }
});

// Serve frontend production build statically
app.use(express.static(path.join(__dirname, 'dist')));

// SPA route fallback (returns index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Cosmos Education server running at http://0.0.0.0:${port}`);
});
