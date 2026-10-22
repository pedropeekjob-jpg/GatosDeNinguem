import { BadRequestException } from "@nestjs/common";
import type { ZodType, ZodTypeDef } from "zod";

/** Parses a request body and turns zod errors into a readable 400 response. */
export function parseBody<T>(schema: ZodType<T, ZodTypeDef, unknown>, body: unknown): T {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    throw new BadRequestException({
      message: "Alguns campos não estão corretos.",
      issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
  }
  return result.data;
}
