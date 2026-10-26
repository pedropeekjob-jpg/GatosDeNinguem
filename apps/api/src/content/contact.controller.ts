import { Body, Controller, HttpCode, Inject, Logger, Post, ServiceUnavailableException } from "@nestjs/common";
import { contactMessageSchema, contactTopics, type ContactMessage } from "@gn/domain";
import { API_OPTIONS, type ApiOptions, type ContactRecipients, type OutgoingEmail } from "../common/options";
import { parseBody } from "../common/validation";

/** Where "Contactos" messages go when CONTACT_EMAIL_TO is not set. */
export const DEFAULT_CONTACT_RECIPIENTS = { to: "gatosninguem@gmail.com", cc: ["gatosdeninguemvc@gmail.com"] };

/**
 * "Contactos" form. The site shows no email address: each message is emailed to the association,
 * with Reply-To set to the sender so the team answers straight from their inbox. Nothing is stored.
 */
@Controller("contacto")
export class ContactController {
  private readonly logger = new Logger("Contacto");
  constructor(@Inject(API_OPTIONS) private readonly options: ApiOptions) {}

  @Post()
  @HttpCode(201)
  async send(@Body() body: unknown) {
    if (body && typeof body === "object" && (body as Record<string, unknown>).website_url) return { ok: true };
    const message = parseBody(contactMessageSchema, body);
    const email = contactEmail(message, this.options.contactRecipients ?? DEFAULT_CONTACT_RECIPIENTS);
    if (!this.options.sendEmail) {
      // Demo or email not set up yet: the message is kept in the log so it is not lost.
      this.logger.warn(`Email não configurado (RESEND_API_KEY). Mensagem para ${email.to}:\n${email.subject}\n${email.text}`);
      return { ok: true };
    }
    try {
      await this.options.sendEmail([email]);
    } catch (err) {
      this.logger.error(`Falhou o envio da mensagem de contacto: ${(err as Error).message}`);
      throw new ServiceUnavailableException("Não foi possível enviar a mensagem agora. Tente daqui a pouco.");
    }
    return { ok: true };
  }
}

export function contactEmail(m: ContactMessage, recipients: ContactRecipients): OutgoingEmail {
  const topic = contactTopics[m.topic];
  const lines = [
    `Mensagem enviada pelo formulário de contacto do site.`,
    ``,
    `Assunto: ${topic}`,
    `Nome: ${m.name}`,
    `Email: ${m.email}`,
    m.phone ? `Telefone: ${m.phone}` : null,
    m.orderCode ? `Pedido da loja: ${m.orderCode}` : null,
    ``,
    m.message,
    ``,
    `—`,
    `Para responder, basta carregar em «Responder»: a resposta vai para ${m.email}.`,
  ].filter((l): l is string => l !== null);
  return {
    to: recipients.to,
    cc: recipients.cc?.length ? recipients.cc : undefined,
    replyTo: m.email,
    subject: `[Contacto · ${topic}] ${m.name}`.slice(0, 200),
    text: lines.join("\n"),
  };
}
