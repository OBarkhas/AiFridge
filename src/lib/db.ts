import { PrismaClient } from "../generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

export const prisma = db;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
