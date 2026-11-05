// RUAN MARCELO RAMACIOTI LUZ
import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { env } from "@/lib/env";

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
}

function getStorageConfig() {
  if (
    !env.S3_BUCKET ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY ||
    !env.S3_PUBLIC_BASE_URL
  ) {
    throw new ObjectStorageNotConfiguredError();
  }

  return {
    bucket: env.S3_BUCKET,
    publicBaseUrl: env.S3_PUBLIC_BASE_URL.replace(/\/$/, ""),
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
      }),
    );

    return { key: input.key, url: `${config.publicBaseUrl}/${input.key}` };
  }

  async delete(key: string): Promise<void> {
    const config = getStorageConfig();
    await this.client.send(
      new DeleteObjectCommand({ Bucket: config.bucket, Key: key }),
    );
  }
}

export function getObjectStorage(): ObjectStorage {
  getStorageConfig();
  return new S3ObjectStorage();
}

export function createProductImageKey(productId: string, extension: string) {
  return `products/${productId}/${randomUUID()}.${extension}`;
}
