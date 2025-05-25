import { systemStart, quickLearningCourses } from "./prompt";
import { openai } from "../services/openai";
import { ChatCompletionMessageParam } from "openai/resources/chat";

const systemMessage = {
  role: "system",
  content: `${systemStart}\n${quickLearningCourses}`,
};

export async function getNatalIAResponse(messages: { role: string; content: string }[]) {
  const chatMessages = [systemMessage, ...messages];

  console.log("chatMessages --->",messages);


  const response =  await openai.chat.completions.create({
    model: "gpt-4",
    messages: chatMessages as ChatCompletionMessageParam[],
    temperature: 0.7,
    max_tokens: 150,
  });

  return response.choices[0]?.message?.content
}