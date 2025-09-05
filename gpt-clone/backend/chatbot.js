import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // Cache results for 24 hours

const baseMessages = [
    {
        role: 'system',
        content: `You are a smart personal assistant.
                    If you know the answer to a question, answer it directly in plain English.
                    If the answer requires real-time, local, or up-to-date information, or if you don’t know the answer, use the available tools to find it.
                    You have access to the following tool:
                    webSearch(query: string): Use this to search the internet for current or unknown information.
                    Decide when to use your own knowledge and when to use the tool.
                    Do not mention the tool unless needed.

                    Examples:
                    Q: What is the capital of France?
                    A: The capital of France is Paris.

                    Q: What’s the weather in Mumbai right now?
                    A: (use the search tool to find the latest weather)

                    Q: Who is the Prime Minister of India?
                    A: The current Prime Minister of India is Narendra Modi.

                    Q: Tell me the latest IT news.
                    A: (use the search tool to get the latest news)

                    current date and time: ${new Date().toUTCString()}`,
    },
];

export async function generate(userMessage, threadId) {
    const messages = cache.get(threadId) ?? [...baseMessages];

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

        if (!toolCalls) {
            // Here we end the chatbot response
            cache.set(threadId, messages);
            console.log(JSON.stringify(cache.data))
            return completions.choices[0].message.content;
        }

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
