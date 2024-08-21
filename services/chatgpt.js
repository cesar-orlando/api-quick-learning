require("dotenv").config();
const OpenAI = require("openai");
const { quickLearningCourses, student_custom_functions } = require("../db/data");
const { default: axios } = require("axios");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const data = {};
module.exports = async function generatePersonalityResponse(message, number) {
  try {
    if (Object.keys(data).length === 0) {
      /* data es un objeto vacío, haz algo aquí */
      const systemMessage = { role: "system", content: quickLearningCourses };
      const starterMessage = { role: "user", content: "hey" };
      data[number] = { number: number, messages: [systemMessage, starterMessage] };
    } else {
      if (data[number]?.number === number) {
        /* data no es un objeto vacío, sigue la conversación */
        const messageObj = { role: "user", content: message };
        data[number].messages.push(messageObj);
      } else {
        let numberData = JSON.stringify({
          to: number,
        });

        let config = {
          method: "post",
          maxBodyLength: Infinity,
          url: "http://localhost:3000/api/v2/whastapp/logs-messages",
          headers: {
            "Content-Type": "application/json",
          },
          data: numberData,
        };
        const response = await axios.request(config);
        console.log("response --->", response.data);
        let mapMessage = response.data.findMessages.map((message) => {
          return {
            role: message.direction === "outbound-api" ? "assistant" : "user",
            content: message.body,
          };
        });
        data[number] = { number: number, messages: mapMessage };
      }
    }
    // Genere mensajes de IA, almacene mensajes en los usuarios y devuélvalos al usuario
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: data[number].messages,
      temperature: 1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    //console.log("data[number].messages", data[number].messages)
    const aiResponse = completion.choices[0].message.content;
    data[number].messages.push({ role: "assistant", content: aiResponse });
    return aiResponse;
  } catch (error) {
    console.log("error.message --->", error.message);
    return "En este momento no puedo responder a tu mensaje, un agente se va a comuniar contigo pronto";
  }
};
