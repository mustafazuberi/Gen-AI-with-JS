import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function chat() {
    const completion = await groq.chat.completions
        .create({
            messages: [
                {
                    role: "user",
                    content: "Explain the importance of fast language models",
                },
            ],
            model: "openai/gpt-oss-20b",
        })


}
