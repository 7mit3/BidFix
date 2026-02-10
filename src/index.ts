/**
 * Vercel-compatible Express entry point.
 *
 * Vercel detects this file (src/index.ts) and wraps the default-exported
 * Express app as a single serverless function. Static assets are served
 * from the `public/` directory by Vercel's CDN — express.static() is
 * ignored in production on Vercel.
 *
 * For local development, the app is started via `server/_core/index.ts`
 * which uses Vite middleware and a port listener.
 */
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// Body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// OAuth callback under /api/oauth/callback
registerOAuthRoutes(app);

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
