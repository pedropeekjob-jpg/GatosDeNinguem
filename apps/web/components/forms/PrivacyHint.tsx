/** The line under every consent box: what the data is for, and where to read more (artigo 13.º RGPD). */
export function PrivacyHint({ children = "Usamos os seus dados apenas para isto." }: { children?: React.ReactNode }) {
  return (
    <>
      {children}{" "}
      <a href="/privacidade" target="_blank" rel="noopener">Como tratamos os seus dados</a>
    </>
  );
}
