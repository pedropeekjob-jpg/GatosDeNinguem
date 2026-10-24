import { Inject, Injectable, NotFoundException, mixin, type CanActivate, type Type } from "@nestjs/common";
import { noFeatures, type FeatureFlags } from "@gn/domain";
import { API_OPTIONS, type ApiOptions } from "./options";

export const featureOffMessage: Record<keyof FeatureFlags, string> = {
  patinhas: "As Patinhas ainda não estão ligadas.",
  trocas: "As trocas de Patinhas nos parceiros ainda não estão ligadas.",
  amigo: "Ser Amigo da associação ainda não está disponível.",
};

export const featuresOf = (options: ApiOptions): FeatureFlags => options.features ?? noFeatures;

/** Answers 404 while a feature is switched off, as if the route did not exist yet. */
export function FeatureGuard(name: keyof FeatureFlags): Type<CanActivate> {
  @Injectable()
  class FeatureOnGuard implements CanActivate {
    constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}
    canActivate(): boolean {
      if (!featuresOf(this.options)[name]) throw new NotFoundException(featureOffMessage[name]);
      return true;
    }
  }
  return mixin(FeatureOnGuard);
}
