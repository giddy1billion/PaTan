/**
 * PaTan™ Database Client
 * PostgreSQL connection using Prisma with pg adapter
 */

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

// Connection pool configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL environment variable is not set. Please configure your database connection."
  );
}

// Create PostgreSQL connection pool with optimized settings
const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring a connection
});

// Create Prisma adapter with the pg pool
const adapter = new PrismaPg(pool);

// Singleton pattern for Prisma client
declare global {
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

// Use singleton in development to prevent multiple instances during hot reload
export const db: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}

// Graceful shutdown handling
async function gracefulShutdown() {
  await db.$disconnect();
  await pool.end();
}

// Handle process termination signals
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export { pool };
