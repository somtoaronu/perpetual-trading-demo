import { useMemo } from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { priceSeries } from "../data/mock";
import { usePlanMetrics } from "../hooks/usePlanMetrics";
import { useMarketData } from "../providers/market-data";
import { formatDecimal } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

export function ChartPanel() {
  const { selection, metrics } = usePlanMetrics();
  const { markets } = useMarketData();

  const market = useMemo(() => {
    if (metrics.marketSymbol) {
      return markets.find(
        (item) => item.symbol.toUpperCase() === metrics.marketSymbol?.toUpperCase()
      );
    }
    if (selection.coinSymbol) {
      const candidates = [
        `${selection.coinSymbol.toUpperCase()}-USDT`,
        `${selection.coinSymbol.toUpperCase()}-USDC`,
        `${selection.coinSymbol.toUpperCase()}-USD`
      ];
      return markets.find((item) =>
        candidates.some((symbol) => item.symbol.toUpperCase() === symbol)
      );
    }
    return markets[0];
  }, [markets, metrics.marketSymbol, selection.coinSymbol]);

  const symbolLabel =
    market?.symbol ??
    (selection.coinSymbol ? `${selection.coinSymbol.toUpperCase()}-USDT` : "ETH-USDT");

  const markPrice = market?.markPrice ?? metrics.markPrice ?? null;
  const fundingRate = market?.fundingRate ?? metrics.fundingRate ?? 0;
  const change24h = market?.change24h ?? 0;

  const markDisplay = markPrice
    ? formatDecimal(markPrice, {
        minimumFractionDigits: markPrice < 1 ? 4 : 2,
        maximumFractionDigits: markPrice < 1 ? 6 : 2
      })
    : "—";
  const fundingDisplay = formatDecimal(fundingRate * 100, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  });
  const changeDisplay = formatDecimal(change24h, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    fallback: "0.00"
  });

  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{symbolLabel} Perpetual</CardTitle>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Mark {markDisplay}</span>
            <Badge variant={change24h >= 0 ? "bull" : "bear"}>
              {change24h >= 0 ? "+" : ""}
              {changeDisplay}%
            </Badge>
            <span>
              Funding {fundingRate >= 0 ? "+" : ""}
              {fundingDisplay}%
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Simple Mode</span>
          <Separator orientation="vertical" className="h-6" />
          <span>Next funding in 05:00</span>
        </div>
      </CardHeader>
      <CardContent className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceSeries}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3DD68C" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3DD68C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.35} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#9ca3af"
              fontSize={12}
              domain={["dataMin - 20", "dataMax + 20"]}
            />
            <Tooltip
              cursor={{ stroke: "#6366f1", strokeWidth: 1, opacity: 0.4 }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem"
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3DD68C"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
