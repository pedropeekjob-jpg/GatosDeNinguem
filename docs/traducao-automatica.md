# Tradução automática

O site público existe em português (principal), inglês (`/en`), espanhol (`/es`) e francês (`/fr`).
Menus, botões e páginas fixas estão traduzidos no código. O que a equipa escreve no back office
(gatos, notícias, páginas, parceiros, artigos da loja e a campanha) é traduzido **automaticamente ao guardar**.

## Como funciona

- Ao guardar, a API traduz para os três idiomas os campos novos ou que mudaram em português.
- As traduções feitas pela máquina ficam marcadas como **"por rever"** (`auto: true`). Em cada gato e notícia,
  a secção **Noutros idiomas** mostra-as para ler e corrigir.
- Uma tradução corrigida (ou marcada "Está bem assim") passa a ser da equipa e **nunca é substituída**.
  Se o português mudar depois, carregue em "Voltar a traduzir automaticamente".
- Os nomes dos gatos, "Gatos de Ninguém", "Patinhas" e os nomes de lugares não são traduzidos
  (Estrela, Lua ou Pimenta também são palavras comuns).
- Se o serviço falhar, o texto é guardado na mesma, só em português; o que faltar é traduzido na
  próxima vez que se guardar, ou em **Idiomas › Traduzir o que falta**.
- Conta pessoal, Patinhas e textos legais ficam só em português.

## Ligar (DeepL)

1. Criar uma conta em <https://www.deepl.com/pro-api> e escolher o plano **DeepL API Free**
   (500 000 caracteres por mês, mais do que suficiente). Pede um cartão para verificação, mas o plano é gratuito.
2. Copiar a chave em *Account › API Keys* (as chaves gratuitas acabam em `:fx`).
3. No Render, no serviço da API, em *Environment*, juntar `DEEPL_API_KEY` com essa chave.
4. No back office, abrir **Idiomas**: deve dizer "Tradução automática ligada". Carregar em
   **Traduzir o que falta** para traduzir o que já existe.
