import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

declare global {
    var prisma: any | undefined;
}

const globalForPrisma = globalThis as unknown as {
    prisma: any | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
}).$extends(withAccelerate())

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db