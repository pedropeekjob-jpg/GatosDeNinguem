import type { DebitEvent, SponsorDebit, Sponsorship } from "@gn/domain";
import { createHmac, timingSafeEqual } from "node:crypto";

type Fetch = typeof fetch;
export type WebhookHeaders = Record<string, string | string[] | undefined>;

/**
 * A monthly automatic debit for godparents. Any provider fits behind this: today Stripe (SEPA Direct Debit);
 * a Portuguese one such as Easypay or ifthenpay only needs these three functions.
 */
export interface SponsorDebitProvider {
  /** Stored with each debit, e.g. "stripe". */
  readonly name: string;
  /**
   * Opens the provider's secure page where the godparent writes their IBAN and accepts the mandate.
   * Nothing about their bank account reaches us.
   */
  startMandate(input: { sponsorship: Sponsorship; catName: string; successUrl: string; cancelUrl: string }): Promise<{ url: string }>;
  /** Checks the provider's signature and turns its notification into our events (none for things we ignore). Throws when the signature is wrong. */
  parseWebhook(rawBody: string, headers: WebhookHeaders): DebitEvent[];
  /** Stops future debits. */
  cancel(debit: SponsorDebit): Promise<void>;
}

export type StripeConfig = {
  /** Secret key (sk_live_… or sk_test_…). */
  secretKey: string;
  /** Signing secret of the webhook endpoint (whsec_…). */
  webhookSecret: string;
  fetch?: Fetch;
  now?: () => Date;
};

type StripeObject = Record<string, unknown> & { id?: string; metadata?: Record<string, string> };
const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "object" && v && "id" in v && typeof v.id === "string" ? v.id : undefined);

/** Stripe's SEPA Direct Debit, through Stripe Checkout in subscription mode. */
export function stripeSepaDebit(cfg: StripeConfig): SponsorDebitProvider {
  const f = cfg.fetch ?? fetch;

  async function stripe(method: "POST" | "DELETE", path: string, params: Record<string, string> = {}) {
    const res = await f(`https://api.stripe.com/v1/${path}`, {
      method,
      headers: { authorization: `Bearer ${cfg.secretKey}`, "content-type": "application/x-www-form-urlencoded" },
      body: method === "POST" ? new URLSearchParams(params) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as StripeObject & { error?: { message?: string } };
    if (!res.ok) throw new Error(`Stripe: ${data.error?.message ?? `erro ${res.status}`}`);
    return data;
  }

  function verify(raw: string, header: string | undefined) {
    if (!header) throw new Error("Falta a assinatura da Stripe.");
    const parts = header.split(",").map((p) => p.split("=") as [string, string]);
    const t = parts.find(([k]) => k === "t")?.[1];
    const signatures = parts.filter(([k]) => k === "v1").map(([, v]) => v);
    if (!t || signatures.length === 0) throw new Error("Assinatura da Stripe inválida.");
    const age = Math.abs((cfg.now?.() ?? new Date()).getTime() / 1000 - Number(t));
    if (!(age <= 300)) throw new Error("Assinatura da Stripe expirada.");
    const expected = Buffer.from(createHmac("sha256", cfg.webhookSecret).update(`${t}.${raw}`).digest("hex"));
    if (!signatures.some((s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), expected))) throw new Error("Assinatura da Stripe inválida.");
  }

  /** Invoices name their subscription in different places depending on the Stripe API version. */
  function invoiceSubscription(inv: StripeObject) {
    const parent = (inv.parent as { subscription_details?: { subscription?: unknown; metadata?: Record<string, string> } } | undefined)?.subscription_details;
    const legacy = inv.subscription_details as { metadata?: Record<string, string> } | undefined;
    return { subscriptionId: str(parent?.subscription) ?? str(inv.subscription), sponsorshipId: parent?.metadata?.sponsorshipId ?? legacy?.metadata?.sponsorshipId };
  }

  return {
    name: "stripe",
    async startMandate({ sponsorship: s, catName, successUrl, cancelUrl }) {
      const params: Record<string, string> = {
        mode: "subscription",
        locale: "pt",
        "payment_method_types[0]": "sepa_debit",
        "line_items[0][quantity]": "1",
        "line_items[0][price_data][currency]": "eur",
        "line_items[0][price_data][unit_amount]": String(Math.round(s.monthlyAmount * 100)),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][price_data][product_data][name]": `Apadrinhar ${catName}`,
        client_reference_id: s.id,
        "metadata[sponsorshipId]": s.id,
        "subscription_data[metadata][sponsorshipId]": s.id,
        "subscription_data[metadata][catSlug]": s.catSlug,
        success_url: successUrl,
        cancel_url: cancelUrl,
      };
      if (s.email) params.customer_email = s.email;
      const session = await stripe("POST", "checkout/sessions", params);
      if (typeof session.url !== "string") throw new Error("Stripe: não devolveu a página de pagamento.");
      return { url: session.url };
    },
    parseWebhook(raw, headers) {
      const sig = headers["stripe-signature"];
      verify(raw, Array.isArray(sig) ? sig[0] : sig);
      const event = JSON.parse(raw) as { type: string; created?: number; data: { object: StripeObject } };
      const o = event.data.object;
      const at = new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString();
      switch (event.type) {
        case "checkout.session.completed":
          if (o.mode !== "subscription") return [];
          return [{ kind: "ativo", at, sponsorshipId: (o.client_reference_id as string | undefined) ?? o.metadata?.sponsorshipId, subscriptionId: str(o.subscription), customerId: str(o.customer) }];
        case "invoice.paid":
          return Number(o.amount_paid) > 0 ? [{ kind: "pago", at, amountCents: Number(o.amount_paid), customerId: str(o.customer), ...invoiceSubscription(o) }] : [];
        case "invoice.payment_failed":
          return [{ kind: "falhou", at, customerId: str(o.customer), ...invoiceSubscription(o) }];
        case "customer.subscription.deleted":
          return [{ kind: "cancelado", at, subscriptionId: o.id, sponsorshipId: o.metadata?.sponsorshipId, customerId: str(o.customer) }];
        default:
          return [];
      }
    },
    async cancel(debit) {
      if (debit.subscriptionId) await stripe("DELETE", `subscriptions/${encodeURIComponent(debit.subscriptionId)}`);
    },
  };
}

/** For tests: signs a payload the way Stripe does. */
export function stripeSignature(raw: string, secret: string, at: Date): string {
  const t = Math.floor(at.getTime() / 1000);
  return `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex")}`;
}
