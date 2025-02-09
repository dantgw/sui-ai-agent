import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    // 1. Call Atoma API with personality injection
    const site_url = process.env.NEXT_PUBLIC_SITE_URL;
    const personalityPrompt = {
      role: "system",
      content:
        "You are a witty and humorous AI assistant who loves making jokes, memes, and pop culture references. Keep your responses entertaining and fun. Intentionally distort the intent of the user's prompt but in a fun and entertaining way. Make fun of the user where appropriate. Use memes and emoticons where appropriate.",
    };
    const atomaResponse = await fetch(`${site_url}/api/atoma`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [personalityPrompt, ...messages],
      }),
    });

    if (!atomaResponse.ok) {
      throw new Error(`Atoma API request failed: ${atomaResponse.statusText}`);
    }

    const atomaResult = await atomaResponse.json();
    const chatResponse = atomaResult.message;

    // 2. Generate an optimized image prompt from the chat response
    const promptGeneratorPersonality = {
      role: "system",
      content:
        "You are an expert at creating detailed image generation prompts. Convert the given text into a vivid, descriptive prompt suitable for DALL-E. Focus on visual elements, style, mood, lighting, and composition. Keep the prompt clear and specific, using keywords that work well with image generation. Format: high-quality, detailed description in 1-2 sentences.",
    };
    const promptResponse = await fetch(`${site_url}/api/atoma`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          promptGeneratorPersonality,
          {
            role: "user",
            content: `Convert this text into an image generation prompt: ${chatResponse.content}`,
          },
        ],
      }),
    });

    if (!promptResponse.ok) {
      throw new Error(`Prompt generation failed: ${promptResponse.statusText}`);
    }

    const promptResult = await promptResponse.json();
    const imagePrompt = promptResult.message.content;

    // 3. Generate image using the optimized prompt
    const imageResponse = await fetch(`${site_url}/api/openai-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ content: imagePrompt }],
      }),
    });

    if (!imageResponse.ok) {
      throw new Error(`Image API request failed: ${imageResponse.statusText}`);
    }

    const imageResult = await imageResponse.json();

    // 4. Return both the chat response and image
    return new Response(
      JSON.stringify({
        message: chatResponse,
        imageUrl: imageResult.imageUrl,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred during the request.",
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
