export class BoundedStreamError extends Error {
  constructor(public readonly code: "request_too_large" | "timeout" | "cancelled") { super(code); }
}

export async function readBoundedStream(stream: ReadableStream<Uint8Array>, maximum: number, signal?: AbortSignal, timeoutMs = 30_000) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timedOut = false;
  const cancel = () => { void reader.cancel().catch(() => undefined); };
  const timer = setTimeout(() => { timedOut = true; cancel(); }, timeoutMs);
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    if (signal?.aborted) throw new BoundedStreamError("cancelled");
    while (true) {
      const part = await reader.read();
      if (timedOut) throw new BoundedStreamError("timeout");
      if (signal?.aborted) throw new BoundedStreamError("cancelled");
      if (part.done) break;
      size += part.value.byteLength;
      if (size > maximum) { cancel(); throw new BoundedStreamError("request_too_large"); }
      chunks.push(part.value);
    }
    const result = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
    return result;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}
