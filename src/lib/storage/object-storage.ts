// RUAN MARCELO RAMACIOTI LUZ
import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";
import { LocalObjectStorage, localCatalogImageRoot } from "./local-object-storage";
import { readBoundedStream } from "@/lib/security/bounded-stream";

export class ObjectStorageNotConfiguredError extends Error {
  constructor() {
    super("Object storage is not configured");
    this.name = "ObjectStorageNotConfiguredError";
  }
}

export type StoredObject = {
  key: string;
  url: string;
};

type PutObjectInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

export interface ObjectStorage {
  put(input: PutObjectInput): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  read(key: string, signal?: AbortSignal): Promise<{ body: Uint8Array; contentType: string }>;
}

function getStorageConfig() {
  if (
    !env.S3_BUCKET ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  ) {
    throw new ObjectStorageNotConfiguredError();
  }

  return {
    bucket: env.S3_BUCKET,
  };
}

class S3ObjectStorage implements ObjectStorage {
  private readonly client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });

  async put(input: PutObjectInput): Promise<StoredObject> {
    const config = getStorageConfig();
    await this.client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        // Cache policy is not an authorization boundary; bucket privacy must be enforced separately.
        CacheControl: "private, no-store, max-age=0",
      }),
    );

    return { key: input.key, url: `/api/catalog-images/${input.key}` };
  }

  async delete(key: string): Promise<void> {
    const config = getStorageConfig();
    await this.client.send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
  }

  async read(key: string, signal?: AbortSignal) {
    const config = getStorageConfig();
    const readSignal = AbortSignal.any([AbortSignal.timeout(30000), ...(signal ? [signal] : [])]);
    const object = await this.client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }), { abortSignal: readSignal });
    if (!object.Body || (object.ContentLength ?? 0) > 8 * 1024 * 1024) throw new Error("invalid_image");
    const body = await readBoundedStream(object.Body.transformToWebStream(), 8 * 1024 * 1024, readSignal);
    return { body, contentType: object.ContentType?.split(";", 1)[0] ?? "application/octet-stream" };
  }
}

export function getObjectStorage(): ObjectStorage {
  if (env.STORAGE_DRIVER === "local") {
    if (env.NODE_ENV === "production") throw new ObjectStorageNotConfiguredError();
    return new LocalObjectStorage(localCatalogImageRoot());
  }
  getStorageConfig();
  return new S3ObjectStorage();
}

export function createProductImageKey(productId: string, extension: string) {
  return `products/${productId}/${randomUUID()}.${extension}`;
}
