import { TrendingDown, TrendingUp } from "lucide-react";

import { orderBook, trades } from "../data/mock";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function OrderflowPanel() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Order Book &amp; Trades</CardTitle>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="bull" className="gap-1">
            <TrendingUp className="h-3 w-3" /> Bids
          </Badge>
          <Badge variant="bear" className="gap-1">
            <TrendingDown className="h-3 w-3" /> Asks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Bids
            </h4>
            <ScrollArea className="h-48 rounded-lg border border-border/40 bg-muted/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Price</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBook.bids.map((level) => (
                    <TableRow key={`bid-${level.price}`}>
                      <TableCell className="text-bull">
                        {level.price.toFixed(1)}
                      </TableCell>
                      <TableCell>{level.size.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
              Asks
            </h4>
            <ScrollArea className="h-48 rounded-lg border border-border/40 bg-muted/10">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Price</TableHead>
                    <TableHead>Size</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderBook.asks.map((level) => (
                    <TableRow key={`ask-${level.price}`}>
                      <TableCell className="text-bear">
                        {level.price.toFixed(1)}
                      </TableCell>
                      <TableCell>{level.size.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </section>
        </div>
        <Separator />
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase text-muted-foreground">
              Recent Trades
            </h4>
            <span className="text-xs text-muted-foreground">Streaming mock data</span>
          </div>
          <ScrollArea className="h-48 rounded-lg border border-border/40 bg-muted/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Side</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Size</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{trade.time}</TableCell>
                    <TableCell>
                      <Badge variant={trade.side === "buy" ? "bull" : "bear"}>
                        {trade.side.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{trade.price.toFixed(2)}</TableCell>
                    <TableCell>{trade.size.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </section>
      </CardContent>
    </Card>
  );
}
