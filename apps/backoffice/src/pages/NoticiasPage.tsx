import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { postCategoryLabel, type PostCategory } from "@gn/domain";
import { Badge, Button, ChoiceList, Notice, TextArea, TextField } from "@gn/ui";
import { errorMessage, useApi } from "../lib/api";
import { slugify } from "../lib/slug";
import type { Post } from "../lib/types";

const categories = (Object.keys(postCategoryLabel) as PostCategory[]).map((c) => ({ value: c, label: postCategoryLabel[c] }));

export function NoticiasPage() {
  const api = useApi();
  const posts = useQuery({ queryKey: ["posts"], queryFn: () => api.posts() });
  const [editing, setEditing] = useState<Post | "nova">();
  if (editing) return <PostForm post={editing === "nova" ? undefined : editing} onClose={() => setEditing(undefined)} />;
  return (
    <div className="gn-stack gn-stack--m">
      <h1>Notícias</h1>
      <div><Button onClick={() => setEditing("nova")}>Escrever notícia</Button></div>
      <ul className="gn-stack gn-stack--s">
        {posts.data?.map((p) => (
          <li key={p.id} className="shift">
            <div className="shift__head"><p className="shift__title">{p.title}</p><Badge tone="info">{postCategoryLabel[p.category]}</Badge></div>
            <p className="small muted">{new Date(p.publishedAt).toLocaleDateString("pt-PT")}</p>
            <div><Button variant="secondary" onClick={() => setEditing(p)}>Editar<span className="gn-sr-only"> {p.title}</span></Button></div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PostForm({ post, onClose }: { post?: Post; onClose: () => void }) {
  const api = useApi();
  const qc = useQueryClient();
  const [title, setTitle] = useState(post?.title ?? "");
  const [category, setCategory] = useState<PostCategory>(post?.category ?? "noticia");
  const [summary, setSummary] = useState(post?.summary ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [ctaLabel, setCtaLabel] = useState(post?.cta?.label ?? "");
  const [ctaHref, setCtaHref] = useState(post?.cta?.href ?? "");
  const save = useMutation({
    mutationFn: () => {
      const input = {
        slug: post?.slug ?? slugify(title),
        title,
        category,
        summary,
        body,
        publishedAt: post?.publishedAt ?? new Date().toISOString(),
        cta: ctaLabel && ctaHref ? { label: ctaLabel, href: ctaHref } : undefined,
        seo: post?.seo ?? {},
      };
      return post ? api.updatePost(post.id, input) : api.createPost(input);
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["posts"] }); onClose(); },
  });
  return (
    <form className="gn-stack gn-stack--m" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
      <div><Button variant="quiet" onClick={onClose}>← Voltar</Button></div>
      <h1>{post ? "Editar notícia" : "Nova notícia"}</h1>
      <TextField id="p-title" label="Título" value={title} onChange={(e) => setTitle(e.target.value)} recommended={{ min: 20, max: 80 }} />
      <ChoiceList name="p-cat" legend="Tipo" value={category} onChange={setCategory} options={categories} />
      <TextArea id="p-summary" label="Resumo" hint="Aparece na lista e nas partilhas." rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} recommended={{ min: 70, max: 200 }} />
      <TextArea id="p-body" label="Texto" hint="Deixe uma linha em branco entre parágrafos." rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
      <TextField id="p-cta-label" label="Botão (opcional)" hint="Ex.: Inscrever no Open Day" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
      <TextField id="p-cta-href" label="Para onde leva o botão" hint="Ex.: /ajudar ou https://…" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} />
      {save.isError ? <Notice tone="error" title="Não foi publicada">{errorMessage(save.error)}</Notice> : null}
      <div><Button type="submit" disabled={!title || !summary || !body || save.isPending}>{post ? "Guardar" : "Publicar"}</Button></div>
    </form>
  );
}
