"use client";

import { useToast } from "@/hooks/use-toast";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

export default function Profile() {
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const getBalance = async (address: string) => {
    try {
      console.log("address", address);
      if (!address) {
        console.log("No address found in sessionStorage");
        return;
      }

      // Create Sui client and get balance
      const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });
      const suiBalance = await suiClient.getBalance({
        owner: address,
      });

      // Convert MIST to SUI
      const formattedBalance = (
        Number.parseInt(suiBalance.totalBalance) / Number(MIST_PER_SUI)
      ).toString();
      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error connecting to Sui wallet:", error);
      toast({
        description: "Failed to fetch balance",
      });
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        description: "Failed to copy address",
      });
    }
  };

  useEffect(() => {
    const addr = localStorage.getItem("zkLoginAddress");
    if (!addr) {
      return;
    }

    setAddress(addr);
    getBalance(addr);
  }, [localStorage]);

  return (
    <div className="min-h-screen bg-background p-8 w-full flex flex-row align-middle ">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-8 relative">
          <button
            onClick={() => (window.location.href = "/")}
            className="absolute left-0 rounded-full size-12  hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h2 className="text-lg font-semibold mb-2">Wallet Address</h2>
            <div className="flex items-center gap-2">
              <p className="font-mono text-sm break-all bg-gray-50 p-3 rounded flex-1">
                {address || "No wallet connected"}
              </p>
              {address && (
                <button
                  onClick={copyAddress}
                  className="p-3 rounded hover:bg-gray-100 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check size={20} className="text-green-600" />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Balance</h2>
            <p className="bg-gray-50 p-3 rounded text-sm">
              {balance ? `${balance} SUI` : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
