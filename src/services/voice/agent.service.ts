import axios from "axios";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const AUDIO_DIR = path.resolve(__dirname, "../../../public/audios");

export const getIAResponseAsAudioUrl = async (responseText: string): Promise<string> => {
  if (!responseText) throw new Error("Respuesta de IA vacía.");
  if(responseText == "Inglés en Quick Learning, ¡Hablas o Hablas! Soy NatalIA, ¿Cómo te puedo ayudar hoy?") throw new Error("Respuesta de IA vacía.");

  // 2. Configuración de ElevenLabs
  const voiceId = process.env.ELEVENLABS_VOICE_ID!;
  const apiKey = process.env.ELEVENLABS_API_KEY!;
  const fileName = `${uuidv4()}.mp3`;
  const filePath = path.join(AUDIO_DIR, fileName);

  // 3. Generar audio con ElevenLabs
  const elevenResponse = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/tTQzD8U9VSnJgfwC6HbY/stream`,
    {
      text: responseText,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.7,
        similarity_boost: 0.85,
      },
    },
    {
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      responseType: "stream",
    }
  );

  // 4. Guardar el audio en el servidor
  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    elevenResponse.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  // 5. Retornar la URL pública
  return `${process.env.BASE_URL}/audios/${fileName}`;
};
