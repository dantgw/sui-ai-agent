import { AtomaSDKCore } from "atoma-sdk/core";

import { ATOMA_MODEL } from "@/lib/constants";

const atomaSDK = new AtomaSDKCore({
  bearerAuth: process.env.ATOMA_API_KEY ?? "",
});

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const response = await fetch(
      "https://api.atoma.network/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ATOMA_API_KEY}`,
        },
        body: JSON.stringify({
          messages,
          model: ATOMA_MODEL.FLUX_1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle the result
    console.log(result);

    return new Response(
      JSON.stringify({
        message: result.choices[0].message,
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
