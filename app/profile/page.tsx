"use client";

import { useState, useEffect } from "react";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";

export default function Profile() {
  const [address, setAddress] = useState<string>("");
  const [balance, setBalance] = useState<string>("");
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
        <h1 className="text-3xl font-bold mb-8">Profile</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Wallet Address</h2>
          <p className="font-mono break-all">
            {address || "No wallet connected"}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Balance</h2>
          <p>{balance ? `${balance} SUI` : "Loading..."}</p>
        </div>
      </div>
    </div>
  );
}
