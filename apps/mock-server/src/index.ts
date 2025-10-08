import cors from "cors";
import express from "express";
import { randomInt } from "node:crypto";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";

const app = express();
app.use(cors());
app.use(express.json());

const markets = [
  {
    symbol: "ETH-USDC",
    markPrice: 3215.34,
    indexPrice: 3212.87,
    fundingRate: 0.015,
    change24h: 1.87,
    openInterest: 182345678,
    volume24h: 568123441
  },
  {
    symbol: "BTC-USDC",
    markPrice: 61234.56,
    indexPrice: 61210.12,
    fundingRate: -0.004,
    change24h: -0.63,
    openInterest: 242345901,
    volume24h: 742234112
  }
];

const positions = [
  {
    symbol: "ETH-USDC",
    side: "LONG",
    size: 2.5,
    entryPrice: 3188.5,
    markPrice: 3215.34,
    leverage: 10,
    marginMode: "ISOLATED"
  }
];

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/markets", (_req, res) => {
  res.json(markets);
});

app.get("/positions", (_req, res) => {
  res.json(positions);
});

app.post("/orders", (req, res) => {
  res.json({
    id: `order-${Date.now()}`,
    status: "filled",
    received: req.body
  });
});

app.delete("/orders/:id", (req, res) => {
  res.json({ id: req.params.id, status: "cancelled" });
});

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/stream" });

wss.on("connection", (socket) => {
  socket.send(
    JSON.stringify({
      type: "hello",
      message: "Mock stream connected",
      markets
    })
  );
});

setInterval(() => {
  markets.forEach((market) => {
    const drift = (randomInt(0, 200) - 100) / 100;
    market.markPrice = Number((market.markPrice + drift).toFixed(2));
  });

  const payload = {
    type: "ticker",
    at: Date.now(),
    markets
  };

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(payload));
    }
  });
}, 3000);

const PORT = Number(process.env.PORT ?? 4000);

httpServer.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});
