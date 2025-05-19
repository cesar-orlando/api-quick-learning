import { updateLastMessage } from "../../controllers/chat.controller";
import { findOrCreateCustomer } from "../../controllers/record.controller";
import Chat from "../../models/chat.model";
import { handleMessageType } from "./messageTypeHandler.service";

export const processMessage = async (body: any, io: any) => {
  const { WaId, ProfileName, Body, From } = body;

  // Verificar o crear el cliente
  const customer = await findOrCreateCustomer(WaId, ProfileName);

  const aiField = customer?.customFields.find((field: any) => field.key === "ai");
  // Si no se encuentra el cliente, no procesar el mensaje
  if (aiField?.value == "false") {
    console.log("🤖 El cliente tiene AI desactivada.");
    let chat = await Chat.findOne({ phone: WaId });
    if (!chat) {
      chat = new Chat({
        phone: WaId,
        linkedTable: {
          refModel: "DynamicRecord",
          refId: customer._id,
        },
        conversationStart: new Date(),
      });
    }
    chat.messages.push({
      direction: "inbound",
      body: Body,
      respondedBy: "human",
    });
    await chat.save();
    const dateNow = new Date();
    await updateLastMessage(WaId, Body, dateNow, "human");

    io.emit("nuevo_mensaje", {
      phone: WaId,
      name: ProfileName,
      body: Body,
      date: dateNow,
      record: customer,
    });

    return { message: "El cliente tiene AI desactivada." };
  } else {
    // Procesar el mensaje utilizando handleMessageType
    const result = await handleMessageType(body, customer);
    console.log("result", result);

    io.emit("nuevo_mensaje", {
      phone: WaId,
      name: ProfileName,
      body: Body,
      date: new Date(),
      record: customer,
    });

    return { message: "Mensaje procesado exitosamente.", record: customer };
  }
};
