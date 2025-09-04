import readline from "node:readline/promises"
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
    const completion = await groq.chat.completions
        .create({
            temperature: 1,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `You are an interview grader assistant. Your task is to generate a candidate evaluation score.
            Output must follow this exact JSON structure:
            {
            "confidence": number (1-10 scale),
            "accuracy": number (1-10 scale),
            "pass": boolean (true or false)
            }
            The response must:
                1. Include ALL fields shown above
                2. Use only the exact field names shown
                3. Follow the exact data types specified
                4. Contain ONLY the JSON object and nothing else
            `
                },
                {
                    role: 'user',
                    content: `Q: What does === do in JavaScript?
            A: It checks strict equality—both value and type must match.

            Q: How do you create a promise that resolves after 1 second?
            A: const p = new Promise(r => setTimeout(r, 1000));

            Q: What is hoisting?
            A: JavaScript moves declarations (but not initializations) to the top of their scope before code runs.

            Q: Why use let instead of var?
            A: let is block-scoped, avoiding the function-scope quirks and re-declaration issues of var.`,
                },
            ],
            model: "llama-3.3-70b-versatile",
        })

    const response = completion.choices[0].message.content
    console.log('response -----------------> ', response)
}

async function toolCalling() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const messages = [
        {
            role: "system",
            content: `You are a smart personal assistant who answers questions.
               You have access to a web search tool to search the latest information and real-time data on the internet.
               1. searchWeb({query}: {query: string})`
        },
        {
            role: 'user',
            content: `what is the current weather in mumbai?`,
        },
    ];

    const tools = [
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
    ];

    let toolsCalled = false

    while (true) {
        const question = await rl.question('You: ');

        if (question === "bye") {
            break
        }

        messages.push({ role: 'user', content: question });

        while (true) {
            const completions = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                temperature: 0,
                messages,
                tools: toolsCalled ? [] : tools,
                tool_choice: 'auto'
            });

            const message = completions.choices[0].message;
            const toolCalls = message.tool_calls;


            if (!toolCalls || toolCalls.length === 0) {
                console.log("FINAL RESULT: ", JSON.stringify(completions.choices[0].message, null, 2));
                break
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

                    toolsCalled = true;
                }
            }
        }
    }

    rl.close();
}


async function webSearch({ query }) {
    console.log('web search called')
    const response = await tvly.search(query);
    const finalResult = response.results.map(result => result.content).join('\n\n');
    return finalResult;
}

// main();
toolCalling();
