import { Body, Controller, Get, HttpCode, Inject, Post, UseGuards } from "@nestjs/common";
import { adoptionInterestSchema } from "@gn/domain";
import { randomUUID } from "node:crypto";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";

@Controller("adoptions")
export class AdoptionsController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}

  /** "Quero conhecer" form. Public; a hidden "website_url" field catches spam bots. */
  @Post("interest")
  @HttpCode(201)
  async interest(@Body() body: unknown) {
    if (body && typeof body === "object" && (body as Record<string, unknown>).website_url) return { ok: true };
    const interest = parseBody(adoptionInterestSchema, body);
    await this.options.repository.saveAdoptionInterest({ ...interest, id: randomUUID(), receivedAt: new Date().toISOString() });
    return { ok: true };
  }

  @Get("interest")
  @UseGuards(AdminGuard)
  list() { return this.options.repository.listAdoptionInterests(); }
}
