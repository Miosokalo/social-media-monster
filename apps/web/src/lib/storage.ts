import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { env } from "@/env";

const LOCAL_ROOT = path.join(process.cwd(), ".data", "uploads");

/** Max upload size for one asset (bytes). */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

function s3Client(): S3Client | null {
  if (
    !env.S3_BUCKET ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY ||
    !env.S3_ENDPOINT
  ) {
    return null;
  }
  return new S3Client({
    region: env.S3_REGION ?? "auto",
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

export async function saveUploadedBuffer(opts: {
  workspaceId: string;
  buffer: Buffer;
  mimeType: string;
}): Promise<{
  storageKey: string;
  byteSize: number;
  thumbnailKey?: string;
  width?: number;
  height?: number;
}> {
  if (opts.buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error("upload_too_large");
  }
  const id = nanoid();
  const ext =
    opts.mimeType === "image/png"
      ? "png"
      : opts.mimeType === "image/jpeg"
        ? "jpg"
        : opts.mimeType === "image/webp"
          ? "webp"
          : "bin";
  const storageKey = `${opts.workspaceId}/${id}.${ext}`;

  const client = s3Client();
  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET!,
        Key: storageKey,
        Body: opts.buffer,
        ContentType: opts.mimeType,
      }),
    );
    let thumbnailKey: string | undefined;
    let width: number | undefined;
    let height: number | undefined;
    if (opts.mimeType.startsWith("image/")) {
      try {
        const sharp = (await import("sharp")).default;
        const meta = await sharp(opts.buffer).metadata();
        width = meta.width ?? undefined;
        height = meta.height ?? undefined;
        const thumb = await sharp(opts.buffer)
          .resize(480, 480, { fit: "inside" })
          .jpeg({ quality: 82 })
          .toBuffer();
        thumbnailKey = `${opts.workspaceId}/${id}_thumb.jpg`;
        await client.send(
          new PutObjectCommand({
            Bucket: env.S3_BUCKET!,
            Key: thumbnailKey,
            Body: thumb,
            ContentType: "image/jpeg",
          }),
        );
      } catch {
        thumbnailKey = undefined;
      }
    }
    return {
      storageKey,
      byteSize: opts.buffer.length,
      thumbnailKey,
      width,
      height,
    };
  }

  await fs.mkdir(path.join(LOCAL_ROOT, opts.workspaceId), {
    recursive: true,
  });
  const full = path.join(LOCAL_ROOT, storageKey);
  await fs.writeFile(full, opts.buffer);
  let thumbnailKey: string | undefined;
  let width: number | undefined;
  let height: number | undefined;
  if (opts.mimeType.startsWith("image/")) {
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(opts.buffer).metadata();
      width = meta.width ?? undefined;
      height = meta.height ?? undefined;
      const thumb = await sharp(opts.buffer)
        .resize(480, 480, { fit: "inside" })
        .jpeg({ quality: 82 })
        .toBuffer();
      thumbnailKey = `${opts.workspaceId}/${id}_thumb.jpg`;
      await fs.writeFile(path.join(LOCAL_ROOT, thumbnailKey), thumb);
    } catch {
      thumbnailKey = undefined;
    }
  }
  return { storageKey, byteSize: opts.buffer.length, thumbnailKey, width, height };
}

export function localFilePath(storageKey: string): string {
  return path.join(LOCAL_ROOT, storageKey);
}
