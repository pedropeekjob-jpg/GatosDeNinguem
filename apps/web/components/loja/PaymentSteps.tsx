import { euros, type Delivery, type Payment, type ShopSettings } from "@gn/domain";
import { CopyIban } from "@/components/client/CopyIban";

/** What to do after donating, in the words of the payment the person chose. */
export function PaymentSteps({ code, totalCents, payment, delivery, settings }: { code: string; totalCents: number; payment: Payment; delivery: Delivery; settings: ShopSettings }) {
  const total = euros(totalCents);
  return (
    <div className="gn-stack gn-stack--m">
      <p className="order-code">O seu donativo: <strong>{code}</strong></p>
      {payment === "mbway" ? (
        settings.mbwayPhone ? (
          <p>Envie <strong>{total}</strong>{delivery === "correio" ? " mais os portes" : ""} por MB WAY para o número <strong>{settings.mbwayPhone}</strong> e escreva <strong>{code}</strong> na mensagem.{delivery === "correio" ? " Dizemos-lhe o valor dos portes antes de pagar." : ""}</p>
        ) : (
          <p>Ligamos-lhe nos próximos dias para combinar o pagamento de <strong>{total}</strong> por MB WAY.</p>
        )
      ) : null}
      {payment === "transferencia" ? (
        <>
          <p>Transfira <strong>{total}</strong>{delivery === "correio" ? " mais os portes (dizemos-lhe o valor)" : ""} para a conta da associação e escreva <strong>{code}</strong> no descritivo.</p>
          <CopyIban iban={settings.iban} />
        </>
      ) : null}
      {payment === "ao-levantar" ? <p>Paga <strong>{total}</strong> quando levantar, em dinheiro ou MB WAY.</p> : null}
      <p>{delivery === "correio" ? settings.shipping : settings.pickup}</p>
      <p className="small muted">Guardamos as ofertas para si. Quando o donativo chegar, avisamos. Se mudar de ideias antes de pagar, diga-nos e cancelamos. <a href="/loja/condicoes">Como funcionam os donativos com oferta</a></p>
    </div>
  );
}
