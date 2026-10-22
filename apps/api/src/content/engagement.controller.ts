import { Body, Controller, Get, HttpCode, Inject, Post, Put, UseGuards } from "@nestjs/common";
import { impactSchema, newsletterSignupSchema } from "@gn/domain";
import { AdminGuard } from "../common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "../common/options";
import { parseBody } from "../common/validation";

@Controller()
export class EngagementController {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}

  @Get("impact")
  impact() { return this.options.repository.getImpact(); }

  @Put("impact")
  @UseGuards(AdminGuard)
  async saveImpact(@Body() body: unknown) {
    const saved = await this.options.repository.saveImpact(parseBody(impactSchema, body));
    await this.options.onContentChanged({ type: "page", path: "/" });
    return saved;
  }

  @Post("newsletter")
  @HttpCode(201)
  async subscribe(@Body() body: unknown) {
    if (body && typeof body === "object" && (body as Record<string, unknown>).website_url) return { ok: true };
    const signup = parseBody(newsletterSignupSchema, body);
    await this.options.repository.saveNewsletterSignup({ ...signup, subscribedAt: new Date().toISOString() });
    return { ok: true };
  }
}
