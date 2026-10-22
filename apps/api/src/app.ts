import "reflect-metadata";
import { Controller, Get, Module, type DynamicModule } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AdminGuard } from "./common/admin.guard";
import { API_OPTIONS, type ApiOptions } from "./common/options";
import { AdoptionsController } from "./content/adoptions.controller";
import { CatsController } from "./content/cats.controller";
import { EngagementController } from "./content/engagement.controller";
import { PagesController } from "./content/pages.controller";
import { PartnersController } from "./content/partners.controller";
import { PostsController } from "./content/posts.controller";
import { SeoController } from "./seo/seo.controller";

@Controller("health")
class HealthController {
  @Get()
  health() { return { ok: true }; }
}

@Module({})
class AppModule {
  static register(options: ApiOptions): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController, AdoptionsController, CatsController, EngagementController, PagesController, PostsController, PartnersController, SeoController],
      providers: [{ provide: API_OPTIONS, useValue: options }, AdminGuard],
    };
  }
}

export async function createApp(options: ApiOptions): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule.register(options), new FastifyAdapter(), {
    logger: options.logger ?? ["log", "error", "warn"],
  });
  app.enableCors({ origin: options.corsOrigins ?? true });
  return app;
}
