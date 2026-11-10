import { beforeEach, describe, expect, it, vi } from "vitest";
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({ env: { STORAGE_DRIVER: "s3", NODE_ENV: "test", S3_BUCKET: "test-only-bucket", S3_ACCESS_KEY_ID: "test-only-key", S3_SECRET_ACCESS_KEY: "test-only-secret", S3_PUBLIC_BASE_URL: "https://example.test/catalog", S3_REGION: "us-east-1" } }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class { send = send; },
  PutObjectCommand: class { constructor(public input: unknown) {} },
  GetObjectCommand: class { constructor(public input: unknown) {} },
  DeleteObjectCommand: class { constructor(public input: unknown) {} },
}));
import { getObjectStorage } from "@/lib/storage/object-storage";
beforeEach(() => vi.resetAllMocks());
describe("S3 adapter contract without any S3 network requests", () => {
  it("does not request a public ACL and prohibits caching uploaded catalog copies", async () => {
    send.mockResolvedValue({});
    await getObjectStorage().put({ key: "products/test/image.jpg", body: new Uint8Array([1]), contentType: "image/jpeg" });
    const command = send.mock.calls[0][0];
    expect(command.input.CacheControl).toBe("private, no-store, max-age=0");
    expect(command.input).not.toHaveProperty("ACL");
  });
  it("counts streamed bytes even when the provider omits its length", async () => {
    send.mockResolvedValue({ Body: { transformToWebStream: () => new Response(new Uint8Array(8 * 1024 * 1024 + 1)).body! }, ContentType: "image/jpeg" });
    await expect(getObjectStorage().read("products/test/image.jpg")).rejects.toMatchObject({ code: "request_too_large" });
    expect(send.mock.calls[0][1].abortSignal).toBeInstanceOf(AbortSignal);
  });
  it("bounds the initial GetObject request as well as the streamed body", async () => {
    const deadline = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValueOnce(deadline.signal);
    send.mockImplementation((_command, options) => new Promise((_resolve, reject) => options.abortSignal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true })));
    const pending = getObjectStorage().read("products/test/image.jpg");
    deadline.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(timeout).toHaveBeenCalledWith(30000);
    timeout.mockRestore();
  });
});
