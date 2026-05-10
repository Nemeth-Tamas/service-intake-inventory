const { createServer } = require("http");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const httpServer = createServer();
const io = new Server(httpServer, {
  allowEIO3: true, // Compatibility for older clients
  cors: {
    origin: true, // Reflect the request origin
    methods: ["GET", "POST"],
    credentials: true
  }
});

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const sub = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

sub.subscribe("updates", (err, count) => {
  if (err) console.error("Redis subscribe error:", err);
});

sub.on("message", (channel, message) => {
  if (channel === "updates") {
    const data = JSON.parse(message);
    io.emit(data.event, data.payload);
    console.log("Broadcasted event:", data.event);
  }
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});
