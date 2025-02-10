import { ATOMA_MODEL } from "@/lib/constants";
import { AtomaSDKCore } from "atoma-sdk/core";

const atomaSDK = new AtomaSDKCore({
  bearerAuth: process.env.ATOMA_API_KEY ?? "",
});

export const runtime = "edge";

const functionDefinitions = [
  {
    name: "getCurrentWeather",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: 'The location to get weather for, e.g. "London, UK"',
        },
      },
      required: ["location"],
    },
  },
];
// Define available functions
const availableFunctions = {
  getCurrentWeather: async (location: string) => {
    // Mock weather function - replace with actual weather API call
    return {
      temperature: 20,
      unit: "celsius",
      location,
      executeOnFrontend: false,
    };
  },
  // sendSuiTokens: async ({
  //   recipientAddress,
  //   amount,
  // }: {
  //   recipientAddress: string;
  //   amount: string;
  // }) => {
  //   return {
  //     executeOnFrontend: true,
  //     functionName: "sendSuiTokens",
  //     args: {
  //       amount,
  //       recipientAddress,
  //     },
  //   };
  // },
};

// Define tools for the AI model
const tools = [
  {
    type: "function",
    function: {
      name: "getCurrentWeather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: 'The location to get weather for, e.g. "London, UK"',
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sendSuiTokens",
      description:
        "Send SUI tokens to a specified address using zkLogin authentication",
      parameters: {
        type: "object",
        properties: {
          recipientAddress: {
            type: "string",
            description: "The Sui wallet address of the recipient",
          },
          amount: {
            type: "string",
            description: "The amount of SUI tokens to send (in MIST)",
          },
        },
        required: ["recipientAddress", "amount"],
      },
    },
  },
];

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    const response = await fetch(
      "https://api.atoma.network/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ATOMA_API_KEY}`,
        },
        body: JSON.stringify({
          messages,
          model: ATOMA_MODEL.LLAMA,
          // function_call: "auto",
          // functions: functionDefinitions,
          // tools,
          // tool_choice: "auto",
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
