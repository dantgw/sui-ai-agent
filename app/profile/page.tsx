"use client";

import { useState, useEffect } from "react";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { ArrowLeft, Copy, Check } from "lucide-react";

export default function Profile() {
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
  const [copied, setCopied] = useState(false);

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
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-8 relative">
          <button
            onClick={() => (window.location.href = "/")}
            className="absolute left-0 rounded-full size-12 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center"
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
