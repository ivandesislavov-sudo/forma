import express from "express";
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
      return res.status(400).json({
        error: "Falta el prompt o una imagen JPEG/PNG/WebP válida."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "El servidor aún no tiene configurada la clave de Gemini."
      });
    }

    const imageMatch = image.match(
      /^data:image\/(jpeg|png|webp);base64,(.+)$/
    );

    const mimeType = `image/${imageMatch[1]}`;
    const imageData = imageMatch[2];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: imageData
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", result);
      throw new Error("Gemini API error");
    }

    const text =
      result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") || "No se pudo generar una respuesta.";

    res.json({ text });

  } catch (err) {
    console.error("Photo analysis error:", err?.message || err);

    res.status(500).json({
      error: "El análisis falló. Revisa la configuración del servidor o inténtalo más tarde."
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`FORMA escuchando en puerto ${port}`);
});
