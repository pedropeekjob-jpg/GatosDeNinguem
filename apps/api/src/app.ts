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
import { CareService } from "./cuidados/care.service";
import { CuidadosController } from "./cuidados/cuidados.controller";
import { VoluntarioCuidadosController } from "./cuidados/voluntario.controller";
import { EscalasController } from "./escalas/escalas.controller";
import { ContaController } from "./patinhas/conta.controller";
import { PatinhasController } from "./patinhas/patinhas.controller";
import { InMemoryPatinhasRepository } from "./patinhas/repository";
import { PatinhasService } from "./patinhas/service";
import { NewsletterSairController, PromocoesController } from "./promocao/promocoes.controller";
import { PromotionService } from "./promocao/promotion.service";
import { SeoController } from "./seo/seo.controller";
import { MAX_UPLOAD_BYTES, UploadsController } from "./media/uploads.controller";

@Controller("health")
class HealthController {
  @Get()
  health() { return { ok: true }; }
}

@Module({})
class AppModule {
  static register(options: ApiOptions): DynamicModule {
    const accounts = options.patinhas ?? new InMemoryPatinhasRepository();
    return {
      module: AppModule,
      controllers: [HealthController, AdoptionsController, CatsController, EngagementController, PagesController, PostsController, PartnersController, EscalasController, SeoController, UploadsController, ContaController, PatinhasController, CuidadosController, VoluntarioCuidadosController, PromocoesController, NewsletterSairController],
      providers: [
        { provide: API_OPTIONS, useValue: options },
        { provide: PatinhasService, useValue: new PatinhasService(options, accounts) },
        { provide: CareService, useValue: new CareService(options, accounts) },
        { provide: PromotionService, useValue: new PromotionService(options) },
        AdminGuard,
      ],
    };
  }
}

export async function createApp(options: ApiOptions): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule.register(options), new FastifyAdapter({ bodyLimit: Math.ceil(MAX_UPLOAD_BYTES * 1.4) }), {
    logger: options.logger ?? ["log", "error", "warn"],
  });
  // Fastify only allows GET, HEAD and POST by default; the back office also edits and deletes.
  app.enableCors({ origin: options.corsOrigins ?? true, methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] });
  return app;
}
