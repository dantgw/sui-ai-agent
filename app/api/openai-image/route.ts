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

    // Fetch the image and convert to blob
    const imageUrl = response.data[0].url;
    if (!imageUrl) throw new Error("No image URL received");
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Convert blob to base64 data URL
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${imageBlob.type};base64,${base64}`;

    return new Response(JSON.stringify({ imageUrl: dataUrl }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
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
