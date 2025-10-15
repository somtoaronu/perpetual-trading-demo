import { useMemo } from "react";

import { addMinutes, format } from "date-fns";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { usePlanMetrics } from "../hooks/usePlanMetrics";
import { useMarketData } from "../providers/market-data";
import { formatDecimal } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

type PricePoint = {
  time: string;
  price: number;
  volume: number;
};

const SERIES_LENGTH = 60;

function seededRandom(seed: string, index: number) {
  let hash = 0;
  const source = `${seed}-${index}`;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) | 0;
  }
  const sinHash = Math.sin(hash) * 10_000;
  return sinHash - Math.floor(sinHash);
}

function generatePriceSeries({
  symbol,
  markPrice,
  changePercent
}: {
  symbol: string;
  markPrice: number;
  changePercent: number;
}): PricePoint[] {
  const base = Number.isFinite(changePercent)
    ? markPrice / (1 + changePercent / 100)
    : markPrice * 0.985;
  const amplitude = Math.max(markPrice * 0.008, markPrice < 1 ? markPrice * 0.2 : 1.5);
  const now = new Date();

  return Array.from({ length: SERIES_LENGTH }, (_, idx) => {
    const progress = idx / Math.max(SERIES_LENGTH - 1, 1);
    const trend = base + (markPrice - base) * progress;
    const wave = Math.sin(progress * Math.PI * 2) * amplitude * 0.6;
    const noise = (seededRandom(symbol, idx) - 0.5) * amplitude * 0.35;
    const rawPrice = trend + wave + noise;
    const decimals = rawPrice < 1 ? 5 : rawPrice < 100 ? 3 : 2;
    const price = Number(rawPrice.toFixed(decimals));

    return {
      time: format(addMinutes(now, idx - (SERIES_LENGTH - 1)), "HH:mm"),
      price: price > 0 ? price : Number((markPrice * 0.8).toFixed(decimals)),
      volume: Math.round(80 + seededRandom(symbol, idx + SERIES_LENGTH) * 45)
    };
  });
}

function resolveYDomain(series: PricePoint[]): [number, number] | ["auto", "auto"] {
  if (series.length === 0) {
    return ["auto", "auto"];
  }
  const prices = series.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return ["auto", "auto"];
  }
  const padding = Math.max((max - min) * 0.1, min * 0.05, 0.5);
  return [Math.max(0, min - padding), max + padding];
}

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

  const series = useMemo(() => {
    const basePrice = Number.isFinite(markPrice) && markPrice ? markPrice : 100;
    return generatePriceSeries({
      symbol: symbolLabel,
      markPrice: basePrice,
      changePercent: Number.isFinite(change24h) ? change24h : 0
    });
  }, [markPrice, change24h, symbolLabel]);

  const yDomain = useMemo(() => resolveYDomain(series), [series]);
  const pricePrecision = useMemo(() => {
    if (!markPrice) {
      return 2;
    }
    if (markPrice < 1) {
      return 5;
    }
    if (markPrice < 100) {
      return 3;
    }
    return 2;
  }, [markPrice]);

  const priceFormatter = useMemo(
    () =>
      (value: number | string | null | undefined) =>
        formatDecimal(typeof value === "number" ? value : Number(value), {
          minimumFractionDigits: pricePrecision,
          maximumFractionDigits: pricePrecision
        }),
    [pricePrecision]
  );

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
          <AreaChart key={symbolLabel} data={series}>
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
              domain={yDomain as [number, number] | ["auto", "auto"]}
              tickFormatter={priceFormatter as (value: number) => string}
            />
            <Tooltip
              cursor={{ stroke: "#6366f1", strokeWidth: 1, opacity: 0.4 }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem"
              }}
              formatter={(value: number | string) => [
                priceFormatter(value),
                "Mark"
              ]}
              labelFormatter={(label) => label as string}
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
