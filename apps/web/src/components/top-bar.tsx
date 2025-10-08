import { Circle, Loader2, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ThemeToggle } from "./theme-toggle";

export function TopBar() {
  const { address, status: accountStatus } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, status: connectStatus } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const metaMaskConnector = useMemo(
    () => connectors.find((connector) => connector.type === "metaMask"),
    [connectors]
  );

  const isConnected = accountStatus === "connected" && !!address;
  const displayAddress =
    address && `${address.slice(0, 4)}...${address.slice(address.length - 4)}`;
  const needsNetworkSwitch = isConnected && chainId !== sepolia.id;

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <span className="text-lg font-semibold tracking-tight">AsterLab</span>
        <Separator orientation="vertical" className="hidden h-6 lg:block" />
        <div className="hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
          <Badge variant="outline" className="gap-1">
            <Circle
              className={`h-2.5 w-2.5 ${
                needsNetworkSwitch ? "text-bear" : "text-bull"
              }`}
            />{" "}
            {needsNetworkSwitch ? "Switch to Sepolia" : "Sepolia"}
          </Badge>
          <span>Funding cycle: 5m demo (vs. live 8h)</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {isConnected ? (
          <div className="flex items-center gap-2">
            <Button
              variant={needsNetworkSwitch ? "destructive" : "secondary"}
              size="sm"
              onClick={() => (needsNetworkSwitch ? switchChain({ chainId: sepolia.id }) : disconnect())}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              {needsNetworkSwitch ? "Switch Network" : displayAddress}
            </Button>
          </div>
        ) : (
          <Button
            variant="default"
            className="gap-2"
            disabled={!metaMaskConnector || connectStatus === "pending"}
            onClick={() =>
              metaMaskConnector
                ? connect({ connector: metaMaskConnector, chainId: sepolia.id })
                : undefined
            }
          >
            {connectStatus === "pending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            Connect MetaMask
          </Button>
        )}
      </div>
    </header>
  );
}
