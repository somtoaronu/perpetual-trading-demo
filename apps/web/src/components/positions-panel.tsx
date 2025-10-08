import { positions } from "../data/mock";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function PositionsPanel() {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Open Positions</CardTitle>
          <Badge variant="outline">{positions.length} Active</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Track PnL, funding, and liquidation thresholds per market.
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-64 rounded-lg border border-border/40 bg-muted/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Side</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Mark</TableHead>
                <TableHead>Leverage</TableHead>
                <TableHead>Liq</TableHead>
                <TableHead>PnL</TableHead>
                <TableHead>Funding</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.symbol}>
                  <TableCell className="font-medium">{position.symbol}</TableCell>
                  <TableCell>
                    <Badge variant={position.side === "Long" ? "bull" : "bear"}>
                      {position.side}
                    </Badge>
                  </TableCell>
                  <TableCell>{position.size}</TableCell>
                  <TableCell>{position.entryPrice.toFixed(2)}</TableCell>
                  <TableCell>{position.markPrice.toFixed(2)}</TableCell>
                  <TableCell>{position.leverage}x</TableCell>
                  <TableCell>{position.liqPrice.toFixed(2)}</TableCell>
                  <TableCell className={position.pnl >= 0 ? "text-bull" : "text-bear"}>
                    {position.pnl >= 0 ? "+" : ""}
                    {position.pnl.toFixed(2)} ({position.pnlPct.toFixed(2)}%)
                  </TableCell>
                  <TableCell className={position.funding >= 0 ? "text-bull" : "text-bear"}>
                    {position.funding >= 0 ? "+" : ""}
                    {position.funding.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
