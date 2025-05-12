import { getMessagesByPhone } from "../controllers/chat.controller";
import Chat from "../models/chat.model";
import { generatePrompt } from "./prompt";
import { openai } from "../services/openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat";
import {
  get_start_dates,
  register_user_name,
  submit_student_complaint,
  suggest_branch_or_virtual_course,
  suggest_nearby_branch,
} from "../tools/openai-tools";

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_start_dates",
      description: "Devuelve las fechas de inicio de los cursos de Quick Learning.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "register_user_name",
      description:
        "Cuando un usuario proporciona su nombre completo, usa esta función para registrarlo y continuar con el proceso de inscripción.",
      parameters: {
        type: "object",
        properties: {
          full_name: {
            type: "string",
            description: "El nombre completo del usuario tal como lo proporcionó.",
          },
        },
        required: ["full_name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_student_complaint",
      description:
        "Si el usuario menciona una queja, problema, inconveniente con un maestro o con la escuela, usa esta función para ayudarle a reportarlo adecuadamente.",
      parameters: {
        type: "object",
        properties: {
          issue_details: {
            type: "string",
            description: "Descripción de la queja del estudiante sobre un maestro o situación en la escuela.",
          },
        },
        required: ["issue_details"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "suggest_branch_or_virtual_course",
      description:
        "Busca si hay una sucursal o escuela o sede de Quick Learning en la ciudad del usuario. Si existe, continúa la conversación ofreciendo opciones. Si no existe, recomienda tomar el curso virtual u online.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "Nombre de la ciudad mencionada por el usuario, como GDL, Guadalajara, CDMX, etc.",
          },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function", // ESTA ES LA CLAVE QUE FALTA
    function: {
      name: "suggest_nearby_branch",
      description: "Sugiere la sucursal más cercana usando dirección o coordenadas.",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Dirección textual proporcionada por el usuario",
          },
          lat: {
            type: "number",
            description: "Latitud si el usuario mandó su ubicación",
          },
          lng: {
            type: "number",
            description: "Longitud si el usuario mandó su ubicación",
          },
        },
      },
    },
  },
];

export const responseIA = async (message: string, phoneUser: string): Promise<string> => {
  const initialContext = await generatePrompt();
  // Obtener historial de mensajes del usuario
  const chatHistory = await Chat.findOne({ phone: phoneUser }); //.populate("messages.advisor").populate("linkedTable.refId");

  let chatHistoryMessages =
    chatHistory?.messages.map((message) => {
      return {
        role: message.direction === "inbound" ? "user" : "assistant",
        content: message.body,
        ...(message.direction !== "inbound" && { name: "assistant_name" }), // Add 'name' for assistant role
      };
    }) || [];

  // Asegurarse de que sea un array
  if (!Array.isArray(chatHistoryMessages)) {
    chatHistoryMessages = [];
  }

  // Agregar contexto inicial y mensaje del usuario
  chatHistoryMessages.unshift({
    role: "system",
    content: initialContext || "",
  });

  chatHistoryMessages.push({
    role: "user",
    content: message,
  });

  // Llamada a OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: chatHistoryMessages as ChatCompletionMessageParam[], // Ensure type compatibility
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 2,
    presence_penalty: 0,
    tools: tools,
    tool_choice: "auto",
  });

  const toolCall = completion.choices[0].message.tool_calls?.[0];

  if (toolCall) {
    const functionName = toolCall.function.name;
    const functionArgs = JSON.parse(toolCall.function.arguments);
    switch (functionName) {
      case "get_start_dates":
        return get_start_dates();
      case "register_user_name":
        return register_user_name(functionArgs.full_name, phoneUser);
      case "submit_student_complaint":
        return submit_student_complaint(functionArgs.issue_details, phoneUser);
      case "suggest_branch_or_virtual_course":
        return suggest_branch_or_virtual_course(functionArgs.city, phoneUser);
      case "suggest_nearby_branch":
        return suggest_nearby_branch(functionArgs, phoneUser);

      /*         case "get_branches":
                return get_branches(WaId); */
      default:
        return "Un asesor se pondrá en contacto contigo en breve.";
    }
  }

  return completion.choices[0]?.message?.content || "No se pudo generar una respuesta.";
};
