import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge"

export async function POST(req: Request) {
  const { messages } = await req.json()

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
    });

    return new Response(JSON.stringify({
      message: completion.choices[0].message
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return new Response(JSON.stringify({
      error: 'An error occurred during the request.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

