import { describe, expect, it } from "vitest";
import { readBoundedJson, maxAdminJsonBytes } from "@/lib/security/request-body";
import { BoundedStreamError } from "@/lib/security/bounded-stream";
import { productInputSchema } from "@/features/products/validation";

describe("bounded administrative JSON", () => {
  it("rejects oversized actual bodies even with absent or falsified Content-Length", async () => {
    for (const headers of [{}, { "content-length": "1" }] as Array<Record<string, string>>) {
      const request = new Request("http://localhost", { method: "POST", body: "x".repeat(maxAdminJsonBytes + 1), headers });
      await expect(readBoundedJson(request)).rejects.toMatchObject({ code: "request_too_large" });
    }
  });
  it("keeps malformed UTF-8/JSON invalid and honors cancellation", async () => {
    expect(await readBoundedJson(new Request("http://localhost", { method: "POST", body: "broken" }))).toBeNull();
    const controller = new AbortController(); controller.abort();
    await expect(readBoundedJson(new Request("http://localhost", { method: "POST", body: "{}", signal: controller.signal }))).rejects.toBeInstanceOf(BoundedStreamError);
  });
  it("still accepts the largest existing product form including escaped characters", async () => {
    const product = { name: "Peça de teste", slug: "teste", description: "\n".repeat(5000), variants: Array.from({ length: 100 }, (_, index) => ({ size: String(index).padEnd(30,"x"), color: "c".repeat(60), available: true })) };
    expect(productInputSchema.safeParse(product).success).toBe(true);
    expect(await readBoundedJson(new Request("http://localhost", { method: "POST", body: JSON.stringify(product) }))).toEqual(product);
  });
});
