import "dotenv/config";
import express, { type Express } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

const DEFAULT_CORS_ORIGINS = ["https://sitar-sitar.github.io"];

function configureCors(app: Express) {
  const configuredOrigins = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([...DEFAULT_CORS_ORIGINS, ...configuredOrigins]);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Vary", "Origin");
    }

    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }

    next();
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const apiOnly = process.env.API_ONLY === "true";

  app.disable("x-powered-by");
  configureCors(app);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "hoyoverse-builder-api" });
  });

  // Manus-specific routes are only needed by the original full-stack runtime.
  // Keep OAuth code unloaded entirely in API-only deployments so public API
  // requests do not depend on Manus-specific environment variables.
  if (!apiOnly) {
    registerStorageProxy(app);
    const { registerOAuthRoutes } = await import("./oauth");
    registerOAuthRoutes(app);
  }

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development" && !apiOnly) {
    await setupVite(app, server);
  } else if (!apiOnly) {
    serveStatic(app);
  } else {
    app.get("/", (_req, res) => {
      res.status(200).json({
        ok: true,
        service: "hoyoverse-builder-api",
        health: "/api/health",
        trpc: "/api/trpc",
      });
    });
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
