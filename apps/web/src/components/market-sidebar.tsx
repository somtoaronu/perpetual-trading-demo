import { Activity, ArrowUpRight, CircleDot } from "lucide-react";

import { markets } from "../data/mock";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";

export function MarketSidebar() {
  return (
    <aside className="hidden w-72 border-r border-border/40 bg-muted/10 lg:flex lg:flex-col">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Markets</h2>
          <Badge variant="outline" className="gap-1">
            <Activity className="h-3.5 w-3.5" /> Live
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Synthetic Mark &amp; Index prices update every few seconds.
        </p>
      </div>
      <Separator />
      <ScrollArea className="flex-1">
        <ul className="divide-y divide-border/40">
          {markets.map((market) => (
            <li key={market.symbol} className="p-4 transition hover:bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{market.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    OI ${(market.openInterest / 1_000_000).toFixed(1)}M · 24h vol $
                    {(market.volume24h / 1_000_000).toFixed(1)}M
                  </p>
                </div>
                <Badge variant={market.change24h >= 0 ? "bull" : "bear"}>
                  {market.change24h >= 0 ? "+" : ""}
                  {market.change24h.toFixed(2)}%
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Mark {market.markPrice.toLocaleString()}</span>
                <span className="flex items-center gap-1">
                  <CircleDot className="h-3 w-3 text-accent" />
                  Funding {(market.fundingRate * 100).toFixed(3)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </ScrollArea>
      <Separator />
      <div className="px-5 py-4 text-xs text-muted-foreground">
        Perpetual equities like NVDA and SPX help illustrate how perps expand beyond crypto.
        <div className="mt-2 inline-flex items-center gap-1 text-accent">
          Explore depth
          <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </aside>
  );
}
