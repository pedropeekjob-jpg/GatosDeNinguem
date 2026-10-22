const clip = (text: string, max: number) => (text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text);

/** Approximates how a page appears in Google results, for the SEO editor. */
export function SearchPreview({ title, url, description }: { title: string; url: string; description: string }) {
  let display = url;
  try {
    const u = new URL(url);
    display = [u.host, ...u.pathname.split("/").filter(Boolean)].join(" › ");
  } catch { /* show raw */ }
  return (
    <figure className="gn-serp" aria-label="Pré-visualização no Google">
      <p className="gn-serp__url">{display}</p>
      <p className="gn-serp__title">{clip(title, 60)}</p>
      <p className="gn-serp__desc">{clip(description, 160)}</p>
    </figure>
  );
}
