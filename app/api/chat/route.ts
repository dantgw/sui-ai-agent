import OpenAI from "openai";
import { Transaction } from "@mysten/sui/transactions";

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

import { SuiClient } from "@mysten/sui/client";
import {
  generateNonce,
  generateRandomness,
  jwtToAddress,
  genAddressSeed,
  getZkLoginSignature,
} from "@mysten/sui/zklogin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

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
  sendSuiTokens: async ({
    recipientAddress,
    amount,
  }: {
    recipientAddress: string;
    amount: string;
  }) => {
    return {
      executeOnFrontend: true,
      functionName: "sendSuiTokens",
      args: {
        amount,
        recipientAddress,
      },
    };
  },
};

// Define function specifications for OpenAI
const tools = [
  {
    type: "function" as const,
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
    type: "function" as const,
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
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      // functions: functionDefinitions,
      // function_call: "auto",
      // tools: tools,
      // tool_choice: "auto",
    });

    const responseMessage = completion.choices[0].message;

    // Check if the model wants to call a function
    if (responseMessage.tool_calls) {
      const functionName = responseMessage.tool_calls[0].function.name;
      const functionToCall =
        availableFunctions[functionName as keyof typeof availableFunctions];
      const functionArgs = JSON.parse(
        responseMessage.tool_calls[0].function.arguments
      );

      // Execute the function
      const functionResult = await functionToCall(functionArgs);
      console.log("functionResult", functionResult);
      // Add function result to messages
      messages.push(responseMessage);
      messages.push({
        role: "function",
        name: functionName,
        content: JSON.stringify(functionResult),
      });

      const returnData = new Response(JSON.stringify({ ...functionResult }), {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(returnData);
      return returnData;
    }

    return new Response(
      JSON.stringify({
        message: responseMessage,
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
