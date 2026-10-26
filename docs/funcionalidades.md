# Funcionalidades que se ligam e desligam

Algumas partes do site já estão feitas mas ainda não estão a ser usadas. Ficam **desligadas** até a associação decidir ligá-las, sem mudar código.

| Nome       | O que liga                                                                                              | Quando desligada                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `patinhas` | Ganhar Patinhas: pontos, níveis, medalhas, desafios do mês e mural de agradecimentos.                  | Não aparecem no início, em Ajudar, na conta nem na gestão. `/patinhas` leva a `/ajudar`. Nada conta pontos.        |
| `trocas`   | Trocar Patinhas por vantagens nos parceiros (com código para mostrar na loja). Só funciona com `patinhas`. | Sem "Trocar nos parceiros" na conta e na página das Patinhas; na gestão, sem os separadores Trocas e Vantagens.    |
| `amigo`    | "Ser Amigo da associação": a quota anual com descontos nos parceiros.                                   | Sem o botão em Ajudar, `/ajudar/amigo` leva a `/ajudar`, o questionário nunca o sugere, e os parceiros não falam do cartão de Amigo.     |

As contas continuam a funcionar com tudo desligado: os voluntários entram, veem os turnos, os gatos a cuidar e as notificações.

## Como ligar

Uma só definição, `FEATURES`, com os nomes separados por vírgulas. Tem de ter o mesmo valor na API e no site.

```
FEATURES=patinhas,trocas,amigo   # tudo
FEATURES=amigo                    # só Ser Amigo
FEATURES=todas                    # o mesmo que tudo
FEATURES=nenhuma                  # tudo desligado (como está agora)
```

- **Render (ambiente de testes):** em cada serviço, `gatosdeninguem-api` e `gatosdeninguem-site`, abra **Environment**, mude `FEATURES` e guarde. A API lê-a ao arrancar; o site lê-a quando é construído, por isso faça **Manual Deploy** ao site.
- **No computador:** `FEATURES=todas pnpm demo`.
- **Demo no GitHub Pages:** fica sempre com tudo desligado.

A gestão pergunta à API o que está ligado (`GET /features`) e mostra só isso. Com as Patinhas desligadas, a API responde 404 em `/patinhas/*` e às trocas, e não dá pontos por turnos, questionário ou conta nova. O que já foi registado fica guardado para quando se ligarem.

## Gato que passeia

De vez em quando, o gato do logótipo, em 3D como num desenho animado, entra pela direita até ao canto inferior direito do ecrã, dá turras no vidro (encosta e esfrega a cabeça, como nas pernas de alguém), dá uma volta sobre si próprio, deita-se e fica a ronronar, com o nome de um gato real para adoção (primeiro os que esperam há mais tempo). Ao tocar nele, ou ao passar o rato por cima, abre o cartão desse gato com o botão "Conhecer". Quando o cartão fecha (ou ao fim de 40 segundos), levanta-se, esfrega mais uma vez a cabeça no vidro e sai por onde entrou. O gato é desenhado de antemão em pequenas imagens (`apps/web/public/gato`, cerca de 330 KB, só descarregadas quando ele aparece) a partir de `apps/web/scripts/gato-3d/gato.html`; para o mudar, editar esse ficheiro e correr `node apps/web/scripts/gato-3d/render-gato-3d.mjs`. As regras estão em `apps/web/lib/passeio.ts`:

- nunca nos primeiros 20 segundos de uma visita, no máximo uma vez a cada 2 minutos e meio e 3 vezes por visita;
- nunca com uma janela aberta, enquanto se escreve, nas páginas de formulários, conta, loja, doar e apadrinhar, nem na visita em que já apareceu o aviso de gato novo;
- "Agora não" esconde-o durante 3 dias; não aparece a quem pediu menos movimento no dispositivo, nem na impressão.

Está ligado. Para o desligar, construir o site com `GATO_PASSEIO=0`. Para o ver logo, abrir qualquer página com `?gato=agora`.
