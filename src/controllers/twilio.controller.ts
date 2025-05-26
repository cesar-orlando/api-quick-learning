import { Request, Response } from "express";
import { saveCallInternal } from "./call.controller";
import { tempCalls } from "../server";

// Normaliza el número a formato 521XXXXXXXXXX
function normalizePhone(phone: string): string {
  // Elimina espacios, guiones y paréntesis
  let clean = phone.replace(/[^\d]/g, "");
  // Si ya empieza con 521 y tiene 13 dígitos, lo dejamos igual
  if (clean.startsWith("521") && clean.length === 13) return clean;
  // Si empieza con 52 y tiene 12 dígitos, agregamos el 1
  if (clean.startsWith("52") && clean.length === 12) return "521" + clean.slice(2);
  // Si tiene 10 dígitos, agregamos 521
  if (clean.length === 10) return "521" + clean;
  // Si tiene 11 dígitos y empieza con 1, agregamos 52
  if (clean.length === 11 && clean.startsWith("1")) return "52" + clean;
  // Si no, lo regresamos como está
  return clean;
}

// 1. Saludo y prompt inicial con gather (input: speech)
export const handleVoiceCall = async (req: Request, res: Response) => {
  const phone = normalizePhone(req.body.From);
  const callSid = req.body.CallSid;
  // Guarda en memoria temporal
  tempCalls[callSid] = { phone };

  const responseXml = `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="wss://api.quick-learning.virtualvoices.com.mx/outbound-stream" /></Connect></Response>`;
  res.type("text/xml");
  res.send(responseXml);
};
