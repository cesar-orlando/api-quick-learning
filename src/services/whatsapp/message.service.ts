import { findOrCreateCustomer } from "../../controllers/record.controller";
import { handleMessageType } from "./messageTypeHandler.service";

export const processMessage = async (body: any, io: any) => {
  const { WaId, ProfileName, Body, From } = body;

  // Verificar o crear el cliente
  const customer = await findOrCreateCustomer(WaId, ProfileName);

  const aiField = customer?.customFields.find((field: any) => field.key === "ai");
  // Si no se encuentra el cliente, no procesar el mensaje
  if (aiField?.value == "false") {
    console.log("🤖 El cliente tiene AI desactivada.");
    return { message: "El cliente tiene AI desactivada." };
  } else {
    // Procesar el mensaje utilizando handleMessageType
    const result = await handleMessageType(body, customer);
    console.log("result", result);
    
    return { message: "Mensaje procesado exitosamente.", record: customer };
  }
};
