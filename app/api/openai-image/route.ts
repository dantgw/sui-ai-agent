import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    // Extract the prompt from the most recent message
    // console.log("messages", messages);
    const prompt = messages[messages.length - 1]?.content || "";
    // console.log("prompt", prompt);
    const response = await openai.images.generate({
      model: "dall-e-3", // or "dall-e-2" depending on your needs
      prompt: prompt,
      n: 1,
      size: "1024x1024", // available sizes: 1024x1024, 512x512, 256x256
    });

    return new Response(
      JSON.stringify({
        message: {
          role: "assistant",
          content: response.data[0].url,
        },
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({
        message: "An error occurred during the request.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
