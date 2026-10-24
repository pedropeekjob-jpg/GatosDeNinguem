import type { CatAlertSent, CatAlertSubscriber } from "@gn/domain";

/** A sign-up as managers see it: no device keys, preferences already in words. */
export type AlertSubscriberView = Omit<CatAlertSubscriber, "push" | "pendingFilters" | "confirmationSentAt"> & { device?: string; preferences: string };
export type AlertsOverview = { setup: { email: boolean; push: boolean }; subscribers: AlertSubscriberView[]; sent: CatAlertSent[] };

/** "Avisem-me quando chegarem gatos": who asked, and what went out. */
export interface AlertasApi {
  alertsOverview(): Promise<AlertsOverview>;
  removeAlertSubscriber(id: string): Promise<void>;
  resendCatAlert(catId: string): Promise<CatAlertSent>;
}

type Call = <T>(method: string, path: string, body?: unknown) => Promise<T>;

export const alertasHttp = (call: Call): AlertasApi => ({
  alertsOverview: () => call("GET", "/alertas/gestao"),
  removeAlertSubscriber: (id) => call("DELETE", `/alertas/gestao/${id}`),
  resendCatAlert: (catId) => call("POST", `/alertas/gestao/gatos/${catId}/enviar`),
});
