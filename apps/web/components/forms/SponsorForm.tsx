"use client";
import { useState, type FormEvent } from "react";
import { MIN_SPONSOR_AMOUNT } from "@gn/domain";
import { Button, Checkbox, ChoiceList, Notice, NextStep, TextArea, TextField } from "@gn/ui";
import { requestSponsorship } from "@/lib/submit";
import { useI18n } from "@/lib/i18n/client";
import { PrivacyHint } from "@/components/forms/PrivacyHint";

const amounts = ["5", "10", "20"] as const;

export function SponsorForm({ catSlug, catName, pronoun }: { catSlug: string; catName: string; pronoun: "a" | "o" }) {
  const { t, l } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", website_url: "" });
  const [amount, setAmount] = useState<string>("10");
  const [other, setOther] = useState("");
  const [payment, setPayment] = useState<"debito" | "combinar">("debito");
  const [newsByEmail, setNewsByEmail] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<string>();
  const [state, setState] = useState<"idle" | "sending" | "a-abrir-banco" | "done">("idle");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState("sending");
    const monthlyAmount = amount === "outro" ? other.replace(",", ".") : amount;
    const result = await requestSponsorship({ ...form, catSlug, monthlyAmount, payment, newsByEmail, consent: consent || undefined, message: form.message || undefined });
    if (result.ok && result.checkoutUrl) {
      setState("a-abrir-banco");
      window.location.assign(result.checkoutUrl);
      return;
    }
    if (result.ok) return setState("done");
    setErrors(result.fieldErrors);
    setSummary(result.message);
    setState("idle");
  }

  if (state === "a-abrir-banco") return <p role="status">{t({ pt: "A abrir a página segura do débito direto…", en: "Opening the secure direct debit page…", es: "Abriendo la página segura de la domiciliación…", fr: "Ouverture de la page sécurisée du prélèvement…" })}</p>;

  if (state === "done") {
    return (
      <NextStep
        title={t({ pt: `Obrigado! ${catName} agradece.`, en: `Thank you! ${catName} is grateful.`, es: `¡Gracias! ${catName} se lo agradece.`, fr: `Merci ! ${catName} vous remercie.` })}
        actions={
          <>
            <Button href={l(`/adotar/${catSlug}`)}>{t({ pt: `Ver ${pronoun} ${catName}`, en: `See ${catName}`, es: `Ver a ${catName}`, fr: `Voir ${catName}` })}</Button>
            <Button href={l("/ajudar")} variant="secondary">{t({ pt: "Outras formas de ajudar", en: "Other ways to help", es: "Otras formas de ayudar", fr: "Autres façons d’aider" })}</Button>
          </>
        }
      >
        {payment === "debito" ? (
          <p>{t({
            pt: <>Recebemos o seu pedido. Na próxima vez que entrar em <a href="/conta/afilhados">A minha conta</a> com este email, pode ativar o débito mensal e acompanhar {pronoun} {catName}. Se o débito ainda não estiver disponível, entramos em contacto nos próximos dias.</>,
            en: <>We have received your request. Next time you sign in to <a href="/conta/afilhados" hrefLang="pt-PT">your account</a> (in Portuguese) with this email, you can set up the monthly debit and follow {catName}. If the debit isn’t available yet, we’ll get in touch in the next few days.</>,
            es: <>Hemos recibido su solicitud. La próxima vez que entre en <a href="/conta/afilhados" hrefLang="pt-PT">su cuenta</a> (en portugués) con este correo, podrá activar la domiciliación mensual y seguir a {catName}. Si la domiciliación aún no está disponible, le contactaremos en los próximos días.</>,
            fr: <>Nous avons bien reçu votre demande. La prochaine fois que vous vous connecterez à <a href="/conta/afilhados" hrefLang="pt-PT">votre compte</a> (en portugais) avec cet e-mail, vous pourrez activer le prélèvement mensuel et suivre {catName}. Si le prélèvement n’est pas encore disponible, nous vous contacterons dans les prochains jours.</>,
          })}</p>
        ) : (
          <p>{t({
            pt: <>Recebemos o seu pedido. Entramos em contacto nos próximos dias para combinar a contribuição. Depois disso pode acompanhar {pronoun} {catName} em <a href="/conta/afilhados">A minha conta</a>, com este email.</>,
            en: <>We have received your request. We’ll get in touch in the next few days to arrange your contribution. After that you can follow {catName} in <a href="/conta/afilhados" hrefLang="pt-PT">your account</a> (in Portuguese), with this email.</>,
            es: <>Hemos recibido su solicitud. Le contactaremos en los próximos días para acordar la contribución. Después podrá seguir a {catName} en <a href="/conta/afilhados" hrefLang="pt-PT">su cuenta</a> (en portugués), con este correo.</>,
            fr: <>Nous avons bien reçu votre demande. Nous vous contacterons dans les prochains jours pour convenir de votre contribution. Ensuite, vous pourrez suivre {catName} dans <a href="/conta/afilhados" hrefLang="pt-PT">votre compte</a> (en portugais), avec cet e-mail.</>,
          })}</p>
        )}
      </NextStep>
    );
  }

  return (
    <form onSubmit={onSubmit} className="gn-stack gn-stack--m" noValidate>
      {summary ? <Notice tone="error" title={t({ pt: "Falta corrigir alguns campos", en: "Some fields need fixing", es: "Hay que corregir algunos campos", fr: "Certains champs sont à corriger" })}>{summary}</Notice> : null}
      <ChoiceList
        name="valor"
        legend={t({ pt: "Quanto quer dar por mês?", en: "How much would you like to give each month?", es: "¿Cuánto quiere dar al mes?", fr: "Combien voulez-vous donner par mois ?" })}
        value={amount}
        onChange={setAmount}
        options={[...amounts.map((v) => ({ value: v, label: `${v} €` })), { value: "outro", label: t({ pt: "Outro valor", en: "Another amount", es: "Otra cantidad", fr: "Autre montant" }) }]}
      />
      {amount === "outro" ? (
        <TextField id="outro-valor" label={t({ pt: "Valor por mês, em euros", en: "Amount per month, in euros", es: "Cantidad al mes, en euros", fr: "Montant par mois, en euros" })} hint={t({ pt: `A partir de ${MIN_SPONSOR_AMOUNT} euros.`, en: `From ${MIN_SPONSOR_AMOUNT} euros.`, es: `Desde ${MIN_SPONSOR_AMOUNT} euros.`, fr: `À partir de ${MIN_SPONSOR_AMOUNT} euros.` })} inputMode="numeric" value={other} onChange={(e) => setOther(e.target.value)} error={errors.monthlyAmount} required />
      ) : errors.monthlyAmount ? <p className="gn-field__error">{errors.monthlyAmount}</p> : null}
      <ChoiceList
        name="pagamento"
        legend={t({ pt: "Como quer contribuir?", en: "How would you like to give?", es: "¿Cómo quiere contribuir?", fr: "Comment voulez-vous contribuer ?" })}
        value={payment}
        onChange={(v) => setPayment(v as typeof payment)}
        options={[
          { value: "debito", label: t({ pt: "Débito direto todos os meses", en: "Monthly direct debit", es: "Domiciliación todos los meses", fr: "Prélèvement tous les mois" }), hint: t({ pt: "Indica o IBAN numa página segura a seguir. Cancela quando quiser, na sua conta.", en: "You enter your IBAN on a secure page next. Cancel whenever you like, in your account.", es: "Indica el IBAN en una página segura a continuación. Cancela cuando quiera, en su cuenta.", fr: "Vous indiquez votre IBAN sur une page sécurisée ensuite. Annulez quand vous voulez, dans votre compte." }) },
          { value: "combinar", label: t({ pt: "Prefiro combinar convosco", en: "I’d rather arrange it with you", es: "Prefiero acordarlo con ustedes", fr: "Je préfère m’arranger avec vous" }), hint: t({ pt: "Transferência ou MB WAY. Entramos em contacto.", en: "Bank transfer or MB WAY. We’ll get in touch.", es: "Transferencia o MB WAY. Le contactaremos.", fr: "Virement ou MB WAY. Nous vous contacterons." }) },
        ]}
      />
      <TextField id="nome" label={t({ pt: "O seu nome", en: "Your name", es: "Su nombre", fr: "Votre nom" })} autoComplete="name" value={form.name} onChange={set("name")} error={errors.name} required />
      <TextField id="email" label={t({ pt: "Email", en: "Email", es: "Correo electrónico", fr: "E-mail" })} hint={t({ pt: `Para entrar na sua conta e acompanhar ${pronoun} ${catName}.`, en: `To sign in to your account and follow ${catName}.`, es: `Para entrar en su cuenta y seguir a ${catName}.`, fr: `Pour vous connecter à votre compte et suivre ${catName}.` })} type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} required />
      <TextField id="telefone" label={t({ pt: "Telefone (opcional)", en: "Phone (optional)", es: "Teléfono (opcional)", fr: "Téléphone (facultatif)" })} type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
      <TextArea id="mensagem" label={t({ pt: "Quer dizer-nos alguma coisa? (opcional)", en: "Anything you’d like to tell us? (optional)", es: "¿Quiere decirnos algo? (opcional)", fr: "Voulez-vous nous dire quelque chose ? (facultatif)" })} value={form.message} onChange={set("message")} />
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website_url">{t({ pt: "Não preencher", en: "Leave empty", es: "No rellenar", fr: "Ne pas remplir" })}</label>
        <input id="website_url" tabIndex={-1} autoComplete="off" value={form.website_url} onChange={set("website_url")} />
      </div>
      <Checkbox id="noticias-email" label={t({ pt: `Quero receber por email as novidades d${pronoun} ${catName}`, en: `Email me news about ${catName}`, es: `Quiero recibir por correo las novedades de ${catName}`, fr: `Je veux recevoir par e-mail des nouvelles de ${catName}` })} hint={t({ pt: "Pode mudar isto quando quiser. As novidades estão sempre na sua conta.", en: "You can change this any time. The news is always in your account.", es: "Puede cambiarlo cuando quiera. Las novedades están siempre en su cuenta.", fr: "Vous pouvez changer cela à tout moment. Les nouvelles sont toujours dans votre compte." })} checked={newsByEmail} onChange={setNewsByEmail} />
      <Checkbox
        id="consentimento"
        label={t({ pt: "Tenho 18 anos ou mais e aceito que a associação me contacte sobre este apadrinhamento", en: "I am 18 or over and agree that the association may contact me about this sponsorship", es: "Tengo 18 años o más y acepto que la asociación me contacte sobre este apadrinamiento", fr: "J’ai 18 ans ou plus et j’accepte que l’association me contacte au sujet de ce parrainage" })}
        hint={<PrivacyHint />}
        checked={consent}
        onChange={setConsent}
      />
      {errors.consent ? <p className="gn-field__error">{errors.consent}</p> : null}
      <Button type="submit" disabled={state === "sending"} block>{state === "sending" ? t({ pt: "A enviar…", en: "Sending…", es: "Enviando…", fr: "Envoi…" }) : payment === "debito" ? t({ pt: "Continuar para o débito", en: "Continue to the direct debit", es: "Continuar a la domiciliación", fr: "Continuer vers le prélèvement" }) : t({ pt: "Enviar pedido", en: "Send request", es: "Enviar solicitud", fr: "Envoyer la demande" })}</Button>
    </form>
  );
}
