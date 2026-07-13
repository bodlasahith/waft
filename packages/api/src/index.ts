import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { connectionRoutes } from "./routes/connections.js";
import { eventRoutes } from "./routes/events.js";
import { userRoutes } from "./routes/users.js";
import { closeDriver } from "./lib/neo4j.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });
await app.register(websocket);

await app.register(connectionRoutes);
await app.register(eventRoutes);
await app.register(userRoutes);

// WebSocket for live event graph updates
app.get("/events/:eventId/live", { websocket: true }, (socket, req) => {
  const { eventId } = req.params as { eventId: string };
  socket.send(JSON.stringify({ type: "connected", eventId }));
});

app.get("/health", async () => ({ status: "ok" }));

const port = Number(process.env.PORT) || 3001;

try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Waft API running on port ${port}`);
} catch (err) {
  app.log.error(err);
  await closeDriver();
  process.exit(1);
}

process.on("SIGTERM", async () => {
  await closeDriver();
  await app.close();
});
