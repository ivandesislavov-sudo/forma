import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({ limit: "12mb" }));
app.use(express.static(__dirname));

app.post("/api/analyze", async (req, res) => {
  try {
    const { prompt, image } = req.body || {};
    if (!prompt || !image || !/^data:image\/(jpeg|png|webp);base64,/.test(image)) {
      return res.status(400).json({ error: "Falta el prompt o una imagen JPEG/PNG/WebP válida." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "El servidor aún no tiene configurada la clave de API." });
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: image, detail: "high" }
        ]
      }]
    });
    res.json({ text: response.output_text || "No se pudo generar una respuesta." });
  } catch (err) {
    console.error("Photo analysis error:", err?.message || err);
    res.status(500).json({ error: "El análisis falló. Revisa la configuración del servidor o inténtalo más tarde." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => console.log(`FORMA escuchando en puerto ${port}`));
