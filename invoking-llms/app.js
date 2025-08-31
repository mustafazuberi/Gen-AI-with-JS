
import Groq from "groq-sdk";
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completion = await groq.chat.completions
    .create({   
      messages: [
        {
          role: "system",
          content: "You are Jarvis, a smart review grader. Your task is to analyze given review and written the sentiment. Classify the review as positive, negative, or neutral. Output must be single word.",
        },
        {
          role: "user",
          content: "Review: These headphones arrived quickly and look great, but the left earcup stopped working after a week.",
        },
      ],     
      model: "llama-3.3-70b-versatile",
      temperature: 0.2
    })
   
    const response = completion.choices[0].message.content
    console.log('response -----------------> ', response)
}

main();
