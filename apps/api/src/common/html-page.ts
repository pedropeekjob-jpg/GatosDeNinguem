/** A small page served by the API itself, for links opened from emails (confirm, unsubscribe). */
export const htmlPage = (title: string, body: string) => `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:4rem auto;padding:0 1rem;color:#111;line-height:1.5}button,.button{display:inline-block;font:inherit;background:#111;color:#fff;border:0;border-radius:999px;padding:.75rem 1.5rem;cursor:pointer;text-decoration:none}</style></head>
<body><h1>${title}</h1>${body}</body></html>`;

export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
