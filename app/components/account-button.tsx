import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, MessageCircle, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import {
  generateNonce,
  generateRandomness,
  jwtToAddress,
} from "@mysten/sui/zklogin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, UserCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { truncateAddress } from "@/lib/utils";

export function AccountButton() {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const handleLogin = async () => {
    // Initialize Sui client
    const FULLNODE_URL = "https://fullnode.devnet.sui.io";
    const suiClient = new SuiClient({ url: FULLNODE_URL });

    // Get current epoch info
    const { epoch } = await suiClient.getLatestSuiSystemState();
    const maxEpoch = Number(epoch) + 2;

    // Generate ephemeral key pair and nonce
    const ephemeralKeyPair = new Ed25519Keypair();
    const randomness = generateRandomness();
    const nonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );

    // Store ephemeral key pair in session storage
    sessionStorage.setItem(
      "zkLoginData",
      // JSON.stringify({
      //   publicKey: Array.from(ephemeralKeyPair.getPublicKey().toRawBytes()),
      // })
      JSON.stringify({
        ephemeralPrivateKey: ephemeralKeyPair.getSecretKey(),
        maxEpoch,
        randomness,
      })
    );

    // Construct Google OAuth URL
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const REDIRECT_URL = process.env.NEXT_PUBLIC_REDIRECT_URL;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      CLIENT_ID!
    )}&response_type=id_token&redirect_uri=${REDIRECT_URL!}&scope=openid&nonce=${nonce}`;

    // Redirect to Google login
    window.location.href = authUrl;
  };

  useEffect(() => {
    // Handle hash parameters since searchParams doesn't work with hash fragments
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace("#", ""));
      const idToken = hashParams.get("id_token");
      const error = hashParams.get("error");

      console.log("Hash parameters:", hashParams);

      if (error) {
        console.error("Authentication error:", error);
        router.push("/login");
        return;
      }

      if (idToken) {
        const userSalt = "129390038577185583942388216820280642146";
        const userAddress = jwtToAddress(idToken, userSalt);

        console.log("User Sui Address:", userAddress);
        localStorage.setItem("id_token", idToken);
        localStorage.setItem("zkLoginAddress", userAddress);
        localStorage.setItem("userSalt", userSalt);
        router.push("/");
      }
    }
  }, [router]); // Remove searchParams from dependencies since we're not using it

  const handleLogout = () => {
    localStorage.removeItem("zkLoginAddress");
    localStorage.removeItem("id_token");
    localStorage.removeItem("zkLoginData");
    localStorage.removeItem("userSalt");
    setAddress(null);
  };

  const handleProfileClick = () => {
    router.push("/profile");
  };

  useEffect(() => {
    // Check if user is logged in by looking for address in local storage
    const savedAddress = localStorage.getItem("zkLoginAddress");
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, []);
  return (
    <div className="p-4 border-t">
      {address ? (
        <div className="w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="rounded-full overflow-clip w-full "
              >
                <UserCircle className="h-6 w-6" />
                {truncateAddress(address)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleProfileClick}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <Button variant="default" size="sm" onClick={handleLogin}>
          Login with Google
        </Button>
      )}
    </div>
  );
}
