import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { MINT_AI_PACKAGE_ADDRESS } from "@/lib/constants";
import { SuiClient } from "@mysten/sui/client";
import {
  genAddressSeed,
  getZkLoginSignature,
  getExtendedEphemeralPublicKey,
} from "@mysten/sui/zklogin";
import { PartialZkLoginSignature } from "@/lib/types";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { toast } from "@/hooks/use-toast";

interface NFTDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  blobId: string | null;
}

export function NFTDialog({ isOpen, onOpenChange, blobId }: NFTDialogProps) {
  const [nftFormData, setNftFormData] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blobId) return;

    try {
      setIsLoading(true);

      // Get stored zkLogin data
      const zkLoginData = sessionStorage.getItem("zkLoginData");
      const jwt = localStorage.getItem("id_token");
      const userSalt = localStorage.getItem("userSalt");

      if (!zkLoginData || !jwt || !userSalt) {
        throw new Error("Missing zkLogin data. Please login again.");
      }

      const { ephemeralPrivateKey, maxEpoch, randomness } =
        JSON.parse(zkLoginData);
      const ephemeralKeyPair = keypairFromSecretKey(ephemeralPrivateKey);

      const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
        ephemeralKeyPair.getPublicKey()
      );

      // Get zkProof from the prover service
      const response = await fetch("https://prover-dev.mystenlabs.com/v1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jwt,
          extendedEphemeralPublicKey,
          maxEpoch,
          jwtRandomness: randomness,
          salt: userSalt,
          keyClaimName: "sub",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const zkProofResult = (await response.json())
        .data as PartialZkLoginSignature;

      // Initialize Sui client
      const client = new SuiClient({
        url:
          process.env.NEXT_PUBLIC_SUI_RPC_URL ||
          "https://fullnode.testnet.sui.io",
      });

      // Create and prepare transaction
      const tx = new Transaction();
      tx.moveCall({
        arguments: [
          tx.pure.string(nftFormData.name),
          tx.pure.string(nftFormData.description),
          tx.pure.string(blobId),
          tx.pure.string(""),
        ],
        target: `${MINT_AI_PACKAGE_ADDRESS}::mint_ai::mint_nft`,
      });

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

      const zkAddress = localStorage.getItem("zkLoginAddress");
      if (!zkAddress) {
        console.log("Not Logged in");
        toast({
          description: "You are not logged in",
        });
        return;
      }
      tx.setSender(zkAddress);

      // Sign transaction with ephemeral key
      const { bytes, signature: userSignature } = await tx.sign({
        client,
        signer: ephemeralKeyPair,
      });

      console.log("zkProofResult:", zkProofResult);
      console.log("addressSeed:", addressSeed);
      console.log("maxEpoch:", maxEpoch);
      console.log("userSignature:", userSignature);

      // Generate complete zkLogin signature
      const zkLoginSignature = getZkLoginSignature({
        inputs: {
          ...zkProofResult,
          addressSeed,
        },
        maxEpoch,
        userSignature: userSignature,
      });

      // Execute transaction
      const result = await client.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });

      console.log("NFT created successfully:", result);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating NFT:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create NFT</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateNFT} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={nftFormData.name}
              onChange={(e) =>
                setNftFormData({ ...nftFormData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={nftFormData.description}
              onChange={(e) =>
                setNftFormData({
                  ...nftFormData,
                  description: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="blobId">Blob ID</Label>
            <Input id="blobId" value={blobId || ""} disabled />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create NFT"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function keypairFromSecretKey(privateKeyBase64: string): Ed25519Keypair {
  const keyPair = decodeSuiPrivateKey(privateKeyBase64);
  return Ed25519Keypair.fromSecretKey(keyPair.secretKey);
}
