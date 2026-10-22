import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BadRequestException, Body, Controller, Get, Inject, NotFoundException, Param, Post, Req, Res, UseGuards } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";

/** Photos arrive already resized by the back office, so a few megabytes is plenty. */
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const types = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
const contentTypes: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

const uploadSchema = z.object({
  type: z.enum(Object.keys(types) as [keyof typeof types, ...(keyof typeof types)[]], { message: "Use uma fotografia JPG, PNG ou WebP." }),
  /** The file contents, base64-encoded (no data: prefix). */
  data: z.string().min(1),
});

/** Photo uploads for cats and page galleries, kept on disk and served back publicly. */
@Controller("uploads")
export class UploadsController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}
  private get dir() { return this.options.uploadDir ?? join(process.cwd(), "uploads"); }

  @Post()
  @UseGuards(AdminGuard)
  async upload(@Body() body: unknown, @Req() req: FastifyRequest) {
    const { type, data } = parseBody(uploadSchema, body);
    const bytes = Buffer.from(data, "base64");
    if (bytes.length === 0) throw new BadRequestException("A fotografia está vazia.");
    if (bytes.length > MAX_UPLOAD_BYTES) throw new BadRequestException("A fotografia é demasiado grande (máximo 6 MB).");
    if (!looksLike(type, bytes)) throw new BadRequestException("O ficheiro não parece ser uma fotografia.");
    const name = `${randomUUID()}.${types[type]}`;
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, name), bytes);
    const base = this.options.publicUrl ?? `${req.protocol}://${req.headers.host}`;
    return { url: `${base}/uploads/${name}` };
  }

  @Get(":name")
  async serve(@Param("name") name: string, @Res() res: FastifyReply) {
    const match = /^[0-9a-f-]{36}\.(jpg|png|webp)$/.exec(name);
    if (!match) throw new NotFoundException();
    const file = await readFile(join(this.dir, name)).catch(() => undefined);
    if (!file) throw new NotFoundException();
    return res.header("content-type", contentTypes[match[1]!]!).header("cache-control", "public, max-age=31536000, immutable").send(file);
  }
}

/** Checks the first bytes, so a renamed text file is not stored as a photo. */
function looksLike(type: keyof typeof types, b: Buffer) {
  if (type === "image/jpeg") return b[0] === 0xff && b[1] === 0xd8;
  if (type === "image/png") return b.subarray(0, 4).toString("hex") === "89504e47";
  return b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP";
}
