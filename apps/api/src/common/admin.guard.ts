import { Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import { timingSafeEqual } from "node:crypto";
import { API_OPTIONS, type ApiOptions } from "./options";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}

  canActivate(context: ExecutionContext): boolean {
    const header: string | undefined = context.switchToHttp().getRequest().headers?.authorization;
    const given = Buffer.from(header?.replace(/^Bearer\s+/i, "") ?? "");
    const expected = Buffer.from(this.options.adminToken);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      throw new UnauthorizedException("Precisa de iniciar sessão para fazer alterações.");
    }
    return true;
  }
}
