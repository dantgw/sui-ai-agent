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
import { useRouter } from "next/navigation";
import { truncateAddress } from "@/lib/utils";

export function AccountButton() {
  const router = useRouter();
  const [address, setAddress] = useState<string | null>(null);

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
    // sessionStorage.setItem(
    //   "ephemeralKeyPair",
    //   JSON.stringify({
    //     publicKey: Array.from(ephemeralKeyPair.getPublicKey()),
    //     privateKey: Array.from(ephemeralKeyPair.export().privateKey),
    //   })
    // );

    // Construct Google OAuth URL
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const REDIRECT_URL = process.env.NEXT_PUBLIC_REDIRECT_URL;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      CLIENT_ID!
    )}&response_type=id_token&redirect_uri=${REDIRECT_URL!}&scope=openid&nonce=${nonce}`;

    // Redirect to Google login
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    localStorage.removeItem("zkLoginAddress");
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
