# Débito direto para padrinhos: o que é preciso configurar

O site já está pronto para o débito direto mensal (SEPA). Falta só ligar uma conta de pagamentos da associação.
Escolhemos a **Stripe** (débito direto SEPA através do Stripe Checkout) porque:

- o padrinho escreve o IBAN numa página segura da Stripe; **o IBAN nunca passa pelo nosso servidor** nem pelos emails;
- a Stripe trata do mandato SEPA: referência única do mandato, texto do mandato com os direitos de reembolso
  (8 semanas para débitos autorizados, 13 meses para não autorizados), identificador de credor e o aviso prévio de cada débito;
- funciona bem no telemóvel e em português;
- a API é estável e bem documentada.

O código não depende da Stripe: está atrás da interface `SponsorDebitProvider` (`apps/api/src/padrinhos/debit.ts`).
Se a associação preferir um fornecedor português (Easypay, ifthenpay) por causa das comissões, basta escrever as mesmas três funções
(abrir a página do mandato, ler as notificações, cancelar).

## Custos

A Stripe cobra por cada débito SEPA cobrado com sucesso (na zona euro, cerca de 0,35 € por débito à data em que escrevemos isto) e uma taxa
quando um débito é devolvido. Confirme os valores atuais em https://stripe.com/pt/pricing. A Stripe tem descontos para associações sem fins lucrativos,
pedidos ao apoio.

## Passos (uma vez)

1. **Criar a conta Stripe da associação** em https://dashboard.stripe.com/register: país Portugal, tipo de entidade "organização sem fins lucrativos",
   NIF, morada, o IBAN da associação (para onde vão os donativos) e os dados do representante legal.
2. **Ativar o débito direto SEPA**: Definições › Métodos de pagamento › *SEPA Direct Debit* › Ativar.
3. **Imagem**: Definições › Branding: logótipo, cor (preto) e nome "Gatos de Ninguém". É o que o padrinho vê na página do IBAN e no extrato.
4. **Emails da Stripe ao padrinho**: Definições › Emails para clientes: ligar os avisos de débito SEPA e os recibos.
   Assim cada padrinho recebe o aviso prévio do valor e da data antes de cada débito, como as regras SEPA pedem.
5. **Webhook** (para o site saber que o débito começou, foi pago, falhou ou foi cancelado):
   Programadores › Webhooks › Adicionar destino
   - URL: `https://<endereço-da-api>/padrinhos/debito/webhook` (no Render: `https://gatosdeninguem-api.onrender.com/padrinhos/debito/webhook`)
   - Eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
   - Copie o *signing secret* (começa por `whsec_`).
6. **Chave da API**: Programadores › Chaves da API › *Secret key* (começa por `sk_live_`, ou `sk_test_` no modo de teste).
7. **No Render** (serviço da API › Environment), acrescentar:
   - `STRIPE_SECRET_KEY` = a chave do passo 6
   - `STRIPE_WEBHOOK_SECRET` = o segredo do passo 5
   - `PUBLIC_SITE_URL` = endereço do site (para o regresso depois do IBAN e para os links nos emails)
   - `RESEND_API_KEY` (já usado para os códigos de entrada) para as novidades por email; opcional `SPONSOR_EMAIL_FROM`, por exemplo `Gatos de Ninguém <padrinhos@gatosdeninguem.pt>`

Sem as duas chaves Stripe, tudo continua a funcionar como antes: o pedido fica "por confirmar" e a equipa combina o pagamento com a pessoa.

## Experimentar primeiro (modo de teste)

Use as chaves de teste (`sk_test_…`) e um webhook criado no modo de teste. Na página da Stripe use estes IBAN de teste:

- `DE89370400440532013000`: o débito passa
- `DE62370400440532013001`: o débito falha (para ver o aviso "O último débito não passou")

Depois de testar, troque para as chaves reais e crie o webhook também no modo real.

## Como funciona no dia a dia

- **Site** `/apadrinhar/<gato>`: o padrinho escolhe o valor e "Débito direto todos os meses", aceita (tem 18 anos ou mais) e segue para a página da Stripe.
  Quando termina, volta a `/conta/afilhados`. O apadrinhamento fica ativo sozinho, sem a equipa ter de confirmar.
- Quem escolhe "Prefiro combinar convosco" (transferência, MB WAY) fica como antes: a equipa confirma em **Escalas › Padrinhos**.
  Um padrinho antigo pode passar a débito na sua área pessoal ("Passar a débito direto").
- **Área pessoal** `/conta/afilhados` (entra com o email que deu): onde o gato está, o estado do débito, quanto já contribuiu,
  e todas as novidades: mudanças de sítio, consultas, medicação, notas da equipa e cartas. Pode escolher o que recebe por email
  (tudo, só as cartas, nada) e **cancelar o débito e o apadrinhamento** com dois toques.
- **Emails**: só a quem marcou "Quero receber por email as novidades" no formulário (não vem marcado). Pedidos de ajuda entre voluntários nunca saem da equipa.
- **Back office › Escalas › Padrinhos**: coluna "Pagamento" (débito ativo, falhou, cancelado, valor recebido), aviso quando um débito falha,
  e "Escrever novidade aos padrinhos" (texto e fotografia), que conta como as notícias do mês.

## Regras SEPA e RGPD (para conferir)

| Regra | Onde fica tratada |
| --- | --- |
| Mandato com referência única e identificador de credor | Stripe (página do mandato e email de confirmação) |
| Direito a reembolso (8 semanas / 13 meses) no texto do mandato | Stripe Checkout mostra o texto do mandato |
| Aviso prévio do valor e data antes do débito | Emails da Stripe (passo 4) |
| Cancelar facilmente | `/conta/afilhados` › "Emails e débito" › Cancelar (cancela na Stripe na hora) |
| IBAN como dado pessoal | Nunca chega ao nosso servidor nem aos emails; fica na Stripe |
| Consentimento separado para emails de novidades | Caixa própria, desmarcada por defeito; pode mudar depois na área pessoal |
| Maioridade | Caixa de consentimento: "Tenho 18 anos ou mais…" |
| Dados de cartão / SCA | Não usamos cartões; a autenticação fica com a Stripe |
