import { describe, expect, it } from "vitest";
import config from "../next.config";

describe("private response cache policy", () => {
  it("sets no-store on admin, auth and private-image paths, including error responses", async () => {
    const policies = await config.headers!();
    for (const source of ["/api/admin/:path*", "/api/auth/:path*", "/api/virtual-fitting", "/api/local-images/:path*", "/api/favorites"]) {
      const headers = policies.find(policy => policy.source === source)?.headers;
      expect(headers).toContainEqual({ key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" });
      expect(headers).toContainEqual({ key: "Pragma", value: "no-cache" });
    }
  });
});
