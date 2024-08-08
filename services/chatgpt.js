require("dotenv").config();
const OpenAI = require('openai');
const { quickLearningCourses, student_custom_functions } = require("../db/data");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const data = {};
module.exports = async function generatePersonalityResponse(message, number) {
  console.log("data ---------------------->", data)

    if(Object.keys(data).length === 0) {
      /* data es un objeto vacío, haz algo aquí */
        const systemMessage = {role: 'system', content: quickLearningCourses}
        const starterMessage = {role: 'user', content: 'hey'}
        data[number] = {messages: [systemMessage, starterMessage]}
    } else {
      /* data no es un objeto vacío, sigue la conversación */
        const messageObj = {role: 'user', content: message}
        data[number].messages.push(messageObj);
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
      console.log("completion", JSON.stringify(completion.choices[0].message))
    const aiResponse = completion.choices[0].message.content
    data[number].messages.push({role: 'assistant', content: aiResponse})
    return aiResponse
}
