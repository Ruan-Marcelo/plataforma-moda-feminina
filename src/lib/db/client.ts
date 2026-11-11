import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Constructing a client opens no connection. Explicit timeouts retain bounded local failures.
export function createDatabaseClient(connectionString = process.env.DATABASE_URL) {
  const schema = connectionString ? new URL(connectionString).searchParams.get("schema") ?? undefined : undefined;
  const adapter = new PrismaPg({ connectionString, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000, max: 10 }, { schema });
  return new PrismaClient({ adapter, log: ["error"] });
}
