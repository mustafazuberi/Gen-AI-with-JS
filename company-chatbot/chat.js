import readline from 'node:readline/promises';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });



export async function chat() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (true) {
        const question = await rl.question('You: ');

        if (question === '/bye') break

        // retrieve from vector DB
        const relevantChunks = await vectorStore.similaritySearch(question, 3);
        const context = relevantChunks.map((chunk, i) => chunk.pageContent).join('\n\n');

        const SYSTEM_PROMPT = `You are a helpful AI assistant for question-answering tasks. Use the following relevant pieces of context to answer the question. If you don't know the answer, just say that you don't know, don't try to make up an answer.`

        const userQuery = `Question: ${question}
        Context: ${context}
        Answer:`;

        console.log("User Query:", userQuery);

        const completion = await groq.chat.completions
            .create({
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT,
                    },
                    {
                        role: "user",
                        content: userQuery,
                    },
                ],
                model: "openai/gpt-oss-20b",
            })

        console.log(`Assistant: ${completion.choices[0].message.content}`);
    }




    rl.close()
}
