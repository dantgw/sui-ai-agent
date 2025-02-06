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

const atomaSDK = new AtomaSDKCore({
  bearerAuth: process.env.ATOMA_API_KEY ?? "",
});

export const runtime = "edge";

// Define available functions
const availableFunctions = {
  getCurrentWeather: async (location: string) => {
    // Mock weather function - replace with actual weather API call
    return { temperature: 20, unit: "celsius", location };
  },
  sendSuiTokens: async ({
    recipientAddress,
    amount,
    jwt,
    userSalt,
    zkProof,
    ephemeralPrivateKey,
    maxEpoch,
  }: {
    recipientAddress: string;
    amount: string;
    jwt: string;
    userSalt: string;
    zkProof: any; // Partial zkLogin signature from prover
    ephemeralPrivateKey: string;
    maxEpoch: number;
  }) => {
    try {
      // Initialize Sui client
      const client = new SuiClient({
        url: process.env.SUI_RPC_URL || "https://fullnode.devnet.sui.io",
      });

      // Reconstruct the ephemeral keypair
      const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
        Buffer.from(ephemeralPrivateKey, "base64")
      );

      // Create transaction block
      const tx = new Transaction();

      // create a new coin with balance 100, based on the coins used as gas payment
      // you can define any balance here
      const [coin] = tx.splitCoins(tx.gas, [amount]);

      // transfer the split coin to a specific address
      tx.transferObjects([coin], recipientAddress);

      // Decode JWT to get sub and aud
      const decodedJwt = JSON.parse(
        Buffer.from(jwt.split(".")[1], "base64").toString()
      );

      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(userSalt),
        "sub",
        decodedJwt.sub,
        decodedJwt.aud
      ).toString();

      // Sign transaction with ephemeral key
      const { bytes, signature: userSignature } = await tx.sign({
        client,
        signer: ephemeralKeyPair,
      });

      // Generate complete zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...zkProof,
          addressSeed,
        },
        maxEpoch,
        userSignature,
      });

      // Execute transaction
      const response = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });

      return {
        status: "success",
        txHash: response.digest,
        amount,
        recipient: recipientAddress,
      };
    } catch (error) {
      console.error("Sui Transaction Error:", error);
      throw new Error("Failed to send Sui tokens: " + (error as Error).message);
    }
  },
};

// Define function specifications for OpenAI
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
  {
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
        jwt: {
          type: "string",
          description: "The JWT token from OAuth provider",
        },
        userSalt: {
          type: "string",
          description: "The user salt for zkLogin",
        },
        zkProof: {
          type: "object",
          description: "The partial zkLogin signature from the prover service",
        },
        ephemeralPrivateKey: {
          type: "string",
          description: "Base64 encoded ephemeral private key",
        },
        maxEpoch: {
          type: "number",
          description:
            "The maximum epoch until which the ephemeral key is valid",
        },
      },
      required: [
        "recipientAddress",
        "amount",
        "jwt",
        "userSalt",
        "zkProof",
        "ephemeralPrivateKey",
        "maxEpoch",
      ],
    },
  },
];

async function run() {
  const res = await chatCreate(atomaSDK, {
    messages: [
      {
        content: "Hello! How can you help me today?",
        role: "user",
      },
    ],
    model: "meta-llama/Llama-3.3-70B-Instruct",
  });

  if (!res.ok) {
    throw res.error;
  }

  const { value: result } = res;

  // Handle the result
  console.log(result);
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  try {
    // const completion = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo",
    //   messages,
    //   temperature: 0.7,
    //   functions: functionDefinitions,
    //   function_call: "auto",
    // });

    const res = await chatCreate(atomaSDK, {
      messages,
      model: "meta-llama/Llama-3.3-70B-Instruct",
    });

    if (!res.ok) {
      throw res.error;
    }

    const { value: result } = res;

    // Handle the result
    console.log(result);

    // const responseMessage = completion.choices[0].message;

    // Check if the model wants to call a function
    // if (responseMessage.functionCall) {
    //   const functionName = responseMessage.function_call.name;
    //   const functionToCall =
    //     availableFunctions[functionName as keyof typeof availableFunctions];
    //   const functionArgs = JSON.parse(responseMessage.function_call.arguments);

    //   // Execute the function
    //   const functionResult = await functionToCall(functionArgs.location);

    //   // Add function result to messages
    //   messages.push(responseMessage);
    //   messages.push({
    //     role: "function",
    //     name: functionName,
    //     content: JSON.stringify(functionResult),
    //   });

    //   // Get a new response from the model
    //   const secondResponse = await openai.chat.completions.create({
    //     model: "gpt-3.5-turbo",
    //     messages,
    //     temperature: 0.7,
    //   });

    //   return new Response(
    //     JSON.stringify({
    //       message: secondResponse.choices[0].message,
    //     }),
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   );
    // }

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
