import axios from "axios";
import fs from "fs";
import path from "path";

export async function transcribeWithDeepgram(buffer: Buffer): Promise<string> {
  const apiKey = process.env.DEEPGRAM_API_KEY!;
  const response = await axios.post(
    "https://api.deepgram.com/v1/listen?language=es",
    buffer,
    {
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "audio/wav"
      }
    }
  );
  return response.data.results.channels[0].alternatives[0].transcript;
}

export function pcmToWav(pcmBuffer: Buffer, sampleRate = 8000, numChannels = 1): Buffer {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const wavHeader = Buffer.alloc(44);

  wavHeader.write("RIFF", 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write("WAVE", 8);
  wavHeader.write("fmt ", 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size
  wavHeader.writeUInt16LE(1, 20); // AudioFormat PCM
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(16, 34); // BitsPerSample
  wavHeader.write("data", 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}