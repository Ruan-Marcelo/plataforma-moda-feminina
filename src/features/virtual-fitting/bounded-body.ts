import { BoundedStreamError as FittingBodyError, readBoundedStream } from "@/lib/security/bounded-stream";
export { BoundedStreamError as FittingBodyError, readBoundedStream } from "@/lib/security/bounded-stream";

export async function readFittingForm(request: Request) {
  const maximum = 9 * 1024 * 1024;
  if (Number(request.headers.get("content-length") ?? 0) > maximum) throw new FittingBodyError("request_too_large");
  if (!request.body) return null;
  const body = await readBoundedStream(request.body, maximum, request.signal);
  return new Request(request.url, { method: "POST", headers: { "content-type": request.headers.get("content-type") ?? "" }, body }).formData();
}
