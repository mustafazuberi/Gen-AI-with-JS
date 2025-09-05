import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generate(userMessage) {
    const messages = [
        {
            role: "system",
            content: `You are a smart personal assistant who answers questions.
               You have access to following tools:
               1. searchWeb({query}: {query: string}) // Search the latest information and real-time data on the internet.
               current date and time: ${new Date().toString()}`
        },
    ];

    messages.push({ role: 'user', content: userMessage });

    while (true) {
        const completions = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0,
            messages,
            tools: [
                {
                    type: "function",
                    function: {
                        name: "webSearch",
                        description: "Search the latest information and real-time data on the internet.",
                        parameters: {
                            type: "object",
                            properties: {
                                query: {
                                    type: "string",
                                    description: "The search query to perform search on."
                                },
                            },
                            required: ["query"]
                        }
                    }
                },
            ],
            tool_choice: 'auto'
        });

        const message = completions.choices[0].message;
        const toolCalls = message.tool_calls;

        if (!toolCalls) return completions.choices[0].message.content;

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name;
            const functionParams = JSON.parse(toolCall.function.arguments);

            if (functionName === 'webSearch') {
                const toolResult = await webSearch(functionParams);
                messages.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: functionName,
                    content: toolResult
                });

                // 🔴 NEW: Add a clarifying system message for the final phase
                messages.push({
                    role: "system",
                    content: "You now have the search results. Answer the user in plain natural language only. Do NOT call any functions or tools again."
                });
            }
        }
    }

}


async function webSearch({ query }) {
    const response = await tvly.search(query);
    const finalResult = response.results.map(result => result.content).join('\n\n');
    return finalResult;
}
