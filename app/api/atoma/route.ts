import { AtomaSDKCore } from "atoma-sdk/core";
import { chatCreate } from "atoma-sdk/funcs/chatCreate";

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
import { ATOMA_MODEL } from "@/lib/constants";

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
          tools,
          tool_choice: "auto",
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();

    // Handle the result
    console.log(result);

    // Parse the content if it's a function call
    try {
      const parsedContent = JSON.parse(result.choices[0].message.content);

      if (parsedContent.type === "function") {
        const functionName = parsedContent.name;
        const functionToCall =
          availableFunctions[functionName as keyof typeof availableFunctions];
        const functionArgs = parsedContent.parameters;

        console.log("functionArgs", functionArgs);
        console.log("functionToCall", functionToCall);

        // Execute the function
        const functionResult = await functionToCall(functionArgs);

        // Add the assistant's response and function result to messages
        messages.push(result.choices[0].message);
        messages.push({
          role: "tool",
          name: functionName,
          content: JSON.stringify(functionResult),
        });

        // Get a new response from the model
        const secondResponse = await fetch(
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
              tools,
              tool_choice: "auto",
            }),
          }
        );

        if (!secondResponse.ok) {
          throw new Error(`API request failed: ${secondResponse.statusText}`);
        }

        const secondResult = await secondResponse.json();

        return new Response(
          JSON.stringify({
            message: secondResult.choices[0].message,
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    } catch (error) {
      console.error("Function call parsing error:", error);
    }

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
