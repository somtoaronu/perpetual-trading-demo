import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { hardhat, sepolia } from "wagmi/chains";
import { metaMask } from "wagmi/connectors";

const config = createConfig({
  chains: [hardhat, sepolia],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http()
  },
  connectors: [metaMask()],
  ssr: false
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
