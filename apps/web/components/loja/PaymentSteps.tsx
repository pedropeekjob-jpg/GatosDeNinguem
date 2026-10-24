import { euros, WITHDRAWAL_DAYS, type Delivery, type Payment, type ShopSettings } from "@gn/domain";
import { CopyIban } from "@/components/client/CopyIban";

/** What to do after ordering, in the words of the payment the person chose. */
export function PaymentSteps({ code, totalCents, payment, delivery, settings }: { code: string; totalCents: number; payment: Payment; delivery: Delivery; settings: ShopSettings }) {
  const total = euros(totalCents);
  return (
    <div className="gn-stack gn-stack--m">
      <p className="order-code">O seu pedido: <strong>{code}</strong></p>
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
      <p className="small muted">Guardamos os artigos para si. Quando o pagamento chegar, avisamos. Se mudar de ideias, responda-nos ou ligue-nos: pode desistir até {WITHDRAWAL_DAYS} dias depois de receber os artigos e devolvemos o dinheiro. <a href="/loja/condicoes">Condições da loja</a></p>
    </div>
  );
}
