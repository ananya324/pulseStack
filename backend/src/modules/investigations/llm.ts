import OpenAI from "openai";
import { env } from "../../config/env";

const client = new OpenAI({
  apiKey: env.LLM_API_KEY,
  baseURL: env.LLM_BASE_URL,
});

const SYSTEM_PROMPT = `You are an incident investigator for a backend application.
You get groups of similar log messages from one service. Answer the developer's question using ONLY these logs.
Rules:
- Never invent facts. If the logs do not show the cause, say so clearly.
- Say what you think happened, how sure you are (low, medium or high), and why.
- Point to evidence using the group numbers, like [G1] or [G2].
- Finish with 1 to 3 simple next steps the developer can try.
- Use short sentences and simple words.`;

export async function askLlm(question: string, evidenceText: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: env.LLM_MODEL,
    max_tokens: 1000,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Question: ${question}\n\nLogs (grouped by similar message):\n${evidenceText}`,
      },
    ],
  });

  return (response.choices[0]?.message?.content ?? "").trim();
}