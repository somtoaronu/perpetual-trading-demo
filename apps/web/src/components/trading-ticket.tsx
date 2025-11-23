import { ChevronDown, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { strategyPresets } from "../data/mock";
import { usePlanMetrics } from "../hooks/usePlanMetrics";
import { formatDecimal } from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function TradingTicket() {
  const { selection, metrics } = usePlanMetrics();
  const [orderSide, setOrderSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState(selection.leverage ?? 5);
  const [size, setSize] = useState(1.25);
  const [marginMode, setMarginMode] = useState<"isolated" | "cross">("isolated");

  useEffect(() => {
    setLeverage(selection.leverage ?? 5);
  }, [selection.leverage]);

  const baseSymbol = selection.coinSymbol ?? "ETH";
  const markPrice = metrics.markPrice || 0;
  const leverageDisplay = formatDecimal(leverage, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    fallback: "—"
  });
  const orderSizeLabel = `Order Size (${baseSymbol.toUpperCase()})`;

  const notional = useMemo(() => markPrice * size, [markPrice, size]);
  const requiredMargin = leverage > 0 ? notional / leverage : notional;
  const fundingSlice = (metrics.fundingRate ?? 0) * notional;
  const liquidationHint = metrics.liquidationPrice;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{baseSymbol.toUpperCase()} Perpetual Ticket</CardTitle>
        <Button variant="ghost" size="sm" className="gap-1">
          Presets
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1">
        <Tabs defaultValue="simple">
          <TabsList className="w-full">
            <TabsTrigger value="simple" className="w-full">
              Simple
            </TabsTrigger>
            <TabsTrigger value="pro" className="w-full">
              Pro
            </TabsTrigger>
          </TabsList>
          <TabsContent value="simple">
            <div className="mt-4 space-y-5">
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={orderSide === "long" ? "default" : "outline"}
                  onClick={() => setOrderSide("long")}
                >
                  Long
                </Button>
                <Button
                  className="flex-1"
                  variant={orderSide === "short" ? "destructive" : "outline"}
                  onClick={() => setOrderSide("short")}
                >
                  Short
                </Button>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{orderSizeLabel}</span>
                  <span>{formatDecimal(size, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={5}
                  step={0.05}
                  value={size}
                  onChange={(event) => setSize(Number(event.target.value))}
                  className="mt-2 w-full accent-primary"
                />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Leverage</span>
                  <span>{leverageDisplay}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={leverage}
                  onChange={(event) => setLeverage(Number(event.target.value))}
                  className="mt-2 w-full accent-primary"
                />
              </div>
              <Separator />
              <div className="space-y-2 rounded-lg border border-border/40 bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Required Margin</span>
                  <span className="font-semibold">
                    {`${formatDecimal(requiredMargin, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} USDT`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Est. Liquidation</span>
                  <span>
                    {formatDecimal(liquidationHint, {
                      minimumFractionDigits: liquidationHint < 1 ? 4 : 2,
                      maximumFractionDigits: liquidationHint < 1 ? 6 : 2
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Funding Impact (next)</span>
                  <span>
                    {`${fundingSlice >= 0 ? "+" : "-"}${formatDecimal(Math.abs(fundingSlice), {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} USDT`}
                  </span>
                </div>
              </div>
              <Button className="w-full text-base">
                {orderSide === "long" ? "Open Long" : "Open Short"}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="pro">
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Limit Price
                  <input
                    type="number"
                    defaultValue={
                      markPrice > 0
                        ? Number(
                            markPrice.toFixed(markPrice < 1 ? 4 : 2)
                          )
                        : 0
                    }
                    className="w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {`Size (${baseSymbol.toUpperCase()})`}
                  <input
                    type="number"
                    defaultValue={1.5}
                    className="w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Take Profit %
                  <input
                    type="number"
                    defaultValue={2}
                    className="w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="space-y-2 text-xs uppercase tracking-wide text-muted-foreground">
                  Stop Loss %
                  <input
                    type="number"
                    defaultValue={1}
                    className="w-full rounded-md border border-border/40 bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                <span>Margin Mode</span>
                <div className="flex gap-2">
                  <Button
                    variant={marginMode === "isolated" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setMarginMode("isolated")}
                  >
                    Isolated
                  </Button>
                  <Button
                    variant={marginMode === "cross" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setMarginMode("cross")}
                  >
                    Cross
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start gap-2 text-sm">
                  <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <p>
                    Pro mode mirrors Aster’s dual-interface concept—unlock advanced controls
                    once you complete the guided onboarding.
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="grid gap-3">
                  {strategyPresets.map((preset) => (
                    <div
                      key={preset.name}
                      className="rounded-md border border-border/30 bg-background/80 p-3"
                    >
                      <p className="text-sm font-medium">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Leverage {preset.settings.leverage}x · TP {preset.settings.takeProfit}%
                        · SL {preset.settings.stopLoss}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full">Submit Advanced Order</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
