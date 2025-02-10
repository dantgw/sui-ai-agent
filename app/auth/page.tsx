"use client";

import { useAuthCallback } from "@mysten/enoki/react";
import { useEffect } from "react";

export default function Page() {
  const { handled } = useAuthCallback(); // This hook will handle the callback from the authentication provider

  useEffect(() => {}, [handled]);

  return <div>Loading...</div>;
}
