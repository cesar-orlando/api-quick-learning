require("dotenv").config();
const OpenAI = require("openai");
const fs = require("fs");
const FormData = require("form-data");
const { default: axios } = require("axios");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Herramientas que OpenAI puede usar automáticamente (para futuras mejoras)
const tools = [
  {
    type: "function",
    function: {
      name: "schedule_school_visit",
      description: "Agenda una cita para que los padres visiten el Colegio Ker Liber.",
      parameters: {
        type: "object",
        properties: {
          preferred_date: {
            type: "string",
            description: "Fecha preferida para la visita.",
          },
          parent_name: {
            type: "string",
            description: "Nombre del padre o madre interesado.",
          },
          contact_number: {
            type: "string",
            description: "Número de contacto del interesado.",
          },
        },
        required: ["preferred_date", "parent_name", "contact_number"],
      },
    },
  },
];

// Función para agendar una visita al colegio (puede integrarse con un backend)
const schedule_school_visit = async ({ preferred_date, parent_name, contact_number }) => {
  try {
    return `✅ *Cita Agendada* ✅\n📅 Fecha: ${preferred_date}\n👤 Nombre: ${parent_name}\n📞 Contacto: ${contact_number}\n\n🎉 ¡Te esperamos en el Colegio Ker Liber! Un asesor te recibirá para conocer las instalaciones y resolver todas tus dudas.`;
  } catch (error) {
    console.error("Error al agendar la visita:", error.message);
    return "No pude agendar la visita en este momento. Inténtalo más tarde.";
  }
};

// 🔹 **Función principal: Responder consultas sobre el Colegio Ker Liber**
module.exports = async function schoolAdmissionsAgent(message, number, mediaType, mediaUrl) {
  try {
    let processedMessage = message;

    // 1️⃣ **Si hay contenido multimedia, procesarlo antes de enviar a OpenAI**
    if (mediaType && mediaUrl) {
      processedMessage += `\n[Contenido recibido: ${mediaType} en ${mediaUrl}]`;
    }

    console.log("number", number);
    // 2️⃣ **Obtener historial de mensajes del usuario**
    let data = JSON.stringify({
      "to": "whatsapp:+5213322155070"
    });
    
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://localhost:10000/api/v2/whastapp/logs-messages',
      headers: { 
        'Content-Type': 'application/json'
      },
      data : data
    };

    const response = await axios.request(config)
    .then((response) => {
      console.log("response", response.data); 
      return response;
    })
    .catch((error) => {
      console.error("Error al obtener el historial de mensajes:", error.message);
      return { data: { findMessages: [] } };
    });
    
    let mapMessage = response.data.findMessages.reverse().map((msg) => ({
      role: msg.direction === "outbound-api" ? "assistant" : "user",
      content: msg.body,
    }));

    // 3️⃣ **Agregar el contexto del Colegio Ker Liber**
    const schoolContext = `Eres ClauIA asesora del *Colegio Ker Liber*, un colegio bilingüe con un enfoque humanista. 
    Tu objetivo es informar a los padres sobre el colegio y *cerrar la venta* agendando una visita. Usa un tono cálido, profesional y persuasivo.

    📚 *Información del Colegio Ker Liber*:
    - **Bilingüe:** Preescolar (70% inglés), Primaria (50% inglés), Secundaria (70% inglés).
    - **Metodología:** Filosofía humanista, aprendizaje basado en proyectos, y pedagogía constructivista.
    - **Actividades:** Educación física diaria, natación semanal (preescolar a primaria).
    - **Vestimenta:** No hay uniforme, los alumnos visten ropa deportiva.
    - **Disciplina:** Basada en valores y consecuencias lógicas.
    - **Talleres vespertinos:** Robótica, deportes, club de conversación en inglés, arte, etc.

    🎓 *Costos del Ciclo Escolar 2025-2026*:
    - **Preescolar:** Inscripción $7,896, Colegiatura mensual $4,995.
    - **Primaria:** Inscripción $9,915, Colegiatura mensual $5,985.
    - **Secundaria:** Inscripción $11,545, Colegiatura mensual $7,275.
    - No hay cuotas de Asociación de Padres ni de nuevo ingreso.

    🏫 *Visitas al colegio*:
    - Presenciales: Lunes a viernes, de 8:00 AM a 1:30 PM.
    - Virtuales: Todos los martes a las 8:00 AM (Google Meet).

    🎯 *Objetivo*: Convertir a los interesados en padres inscritos. 
    Siempre ofrece agendar una cita para que visiten el colegio.
    También deben ser respuestas cortas y al grano, sin información adicional.`;

    mapMessage.unshift({ role: "system", content: schoolContext });
    mapMessage.push({ role: "user", content: processedMessage });

    // 4️⃣ **Llamada a OpenAI con herramientas y contexto**
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: mapMessage,
      temperature: 0.7,
      top_p: 1,
      frequency_penalty: 2,
      presence_penalty: 0,
      tools: tools,
      tool_choice: "auto",
    });

    // 5️⃣ **Si la IA decide agendar una cita, procesar la función correspondiente**
    const toolCall = completion.choices[0].message.tool_calls?.[0];

    if (toolCall) {
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);

      switch (functionName) {
        case "schedule_school_visit":
          return schedule_school_visit(functionArgs);
        default:
          return "No pude procesar tu solicitud. Inténtalo de nuevo.";
      }
    }

    // 6️⃣ **Devolver la respuesta generada por OpenAI**
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error en schoolAdmissionsAgent:", error.message);
    return "En un momento te contactará un asesor para ayudarte.";
  }
};
