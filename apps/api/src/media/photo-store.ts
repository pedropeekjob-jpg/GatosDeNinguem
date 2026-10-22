import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "@prisma/client";

/** Where uploaded photos live: a folder on disk, or the database on hosts without a persistent disk. */
export type PhotoStore = {
  save(name: string, contentType: string, bytes: Buffer): Promise<void>;
  read(name: string): Promise<Buffer | undefined>;
};

export function diskPhotoStore(dir: string): PhotoStore {
  return {
    async save(name, _contentType, bytes) {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, name), bytes);
    },
    read: (name) => readFile(join(dir, name)).catch(() => undefined),
  };
}

export function databasePhotoStore(db: PrismaClient): PhotoStore {
  return {
    async save(name, contentType, bytes) {
      await db.upload.create({ data: { name, contentType, data: bytes } });
    },
    async read(name) {
      const row = await db.upload.findUnique({ where: { name } });
      return row ? Buffer.from(row.data) : undefined;
    },
  };
}
