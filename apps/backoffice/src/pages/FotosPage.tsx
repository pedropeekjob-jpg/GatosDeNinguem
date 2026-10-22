import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { defaultCarouselSettings, type CarouselSettings } from "@gn/domain";
import { AnimatedLogo, Button, Checkbox, Notice, TextField } from "@gn/ui";
import { PhotoManager, type ManagedPhoto } from "../components/PhotoManager";
import { errorMessage, useApi } from "../lib/api";

/** The full-width carousel of shelter photos on the home page. */
export function FotosPage() {
  const api = useApi();
  const qc = useQueryClient();
  const pages = useQuery({ queryKey: ["pages"], queryFn: () => api.pages() });
  const home = pages.data?.find((p) => p.path === "/");
  const [draft, setDraft] = useState<ManagedPhoto[]>();
  const [settings, setSettings] = useState<CarouselSettings>(defaultCarouselSettings);
  useEffect(() => {
    if (home && !draft) { setDraft(home.gallery ?? []); setSettings(home.carousel ?? defaultCarouselSettings); }
  }, [home, draft]);
  const save = useMutation({
    mutationFn: (gallery: ManagedPhoto[]) => {
      if (gallery.some((p) => p.alt.trim().length < 3)) throw new Error("Escreva uma descrição curta em cada fotografia.");
      if (!(settings.intervalSeconds >= 3 && settings.intervalSeconds <= 20)) throw new Error("O tempo de cada fotografia deve ser entre 3 e 20 segundos.");
      return api.updatePage(home!.id, { gallery: gallery.map((p) => ({ ...p, alt: p.alt.trim() })), carousel: settings });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });

  if (pages.isError) return <Notice tone="error" title="Erro">{errorMessage(pages.error)}</Notice>;
  if (!draft) return <AnimatedLogo variant="loader" size={110} />;
  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }}>
      <h1>Fotos do gatil</h1>
      <p className="muted">Aparecem no carrossel da página inicial, pela ordem desta lista. {draft.filter((p) => !p.hidden).length} de {draft.length} visíveis.</p>
      <section className="gn-stack gn-stack--s" aria-labelledby="carousel-settings">
        <h2 id="carousel-settings">Como passa</h2>
        <Checkbox id="carousel-autoplay" label="Passar sozinho para a fotografia seguinte" checked={settings.autoplay} onChange={(v) => { save.reset(); setSettings({ ...settings, autoplay: v }); }} />
        {settings.autoplay ? (
          <TextField id="carousel-interval" label="Segundos em cada fotografia" hint="Entre 3 e 20. Quem pede menos movimento no telemóvel nunca vê a passagem automática." type="number" inputMode="numeric" value={String(settings.intervalSeconds)} onChange={(e) => { save.reset(); setSettings({ ...settings, intervalSeconds: Number(e.target.value) }); }} />
        ) : null}
      </section>
      <h2>Fotografias</h2>
      <PhotoManager photos={draft} onChange={(photos) => { save.reset(); setDraft(photos); }} altFor={(n) => `Gatil Gatos de Ninguém, foto ${n}`} withCaption firstLabel="Primeira" />
      {save.isError ? <Notice tone="error" title="Não foi guardado">{errorMessage(save.error)}</Notice> : null}
      {save.isSuccess ? <Notice tone="success" title="Guardado">A página inicial é atualizada em poucos segundos.</Notice> : null}
      <div><Button type="submit" disabled={save.isPending}>{save.isPending ? "A guardar…" : "Guardar fotos"}</Button></div>
    </form>
  );
}
