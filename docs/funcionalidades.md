# Funcionalidades que se ligam e desligam

Algumas partes do site já estão feitas mas ainda não estão a ser usadas. Ficam **desligadas** até a associação decidir ligá-las, sem mudar código.

| Nome       | O que liga                                                                                              | Quando desligada                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `patinhas` | Ganhar Patinhas: pontos, níveis, medalhas, desafios do mês e mural de agradecimentos.                  | Não aparecem no início, em Ajudar, na conta nem na gestão. `/patinhas` leva a `/ajudar`. Nada conta pontos.        |
| `trocas`   | Trocar Patinhas por vantagens nos parceiros (com código para mostrar na loja). Só funciona com `patinhas`. | Sem "Trocar nos parceiros" na conta e na página das Patinhas; na gestão, sem os separadores Trocas e Vantagens.    |
| `amigo`    | "Ser Amigo da associação": a quota anual com descontos nos parceiros.                                   | Sem o cartão e a secção em Ajudar, o questionário nunca o sugere, e os parceiros não falam do cartão de Amigo.     |

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
