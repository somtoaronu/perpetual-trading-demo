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
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

export function ChartPanel() {
  return (
    <Card className="flex flex-col gap-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>ETH-USDC Perpetual</CardTitle>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Mark 3,215.34</span>
            <Badge variant="bull">+1.87%</Badge>
            <span>Funding +0.015%</span>
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
