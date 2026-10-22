# Accessibility: built for older visitors

Many supporters are older and not comfortable with technology. These rules are enforced by tests where possible; please keep them when adding pages.

**Reading**
- Inter (a screen-first, highly legible sans-serif), body text at least 16px (the browser default, so zoom and the phone's text size setting work as expected). Tested on every page.
- No text size widget: comfortable sizes by default, and the page reflows when visitors zoom or use their phone's own text size.
- High contrast (WCAG AA), links always underlined, plain Portuguese, no jargon.

**Finding things**
- Main menu always visible, never hidden behind a "hamburger". Five items at most. On phones it is a bar fixed to the bottom of the screen, each item an icon plus a word.
- "Encontrei um gato" (emergency) button on every page.
- Breadcrumbs ("Está aqui") on inner pages.

**Doing things**
- Buttons and links at least 44px tall (52px for main actions). Tested.
- One question per screen in longer flows (quiz, SOS guide, adoption interest), with "Passo X de Y" and a "Voltar" button.
- Swipe is only ever a shortcut; every action has a labelled button.
- Error messages say what to do ("Indique o seu nome"), next to the field and in a summary.
- After every form, a clear next step ("Está inscrito. Pôr no meu calendário").

**Technical**
- Every page: one `h1`, landmarks, skip link, visible focus ring, form labels, no horizontal scroll on phones.
- axe-core (WCAG 2.1 AA) runs in component tests and on every page in Playwright on Android, iPhone and desktop.
