# O Vaca Ciclista — Portal estático

Portal de notícias, análises e cultura do ciclismo. **HTML estático + CSS + JS leve**, publicado no **Cloudflare Pages** via Git. Sem banco, sem servidor de aplicação: cada matéria é um arquivo HTML no repositório.

## Arquitetura

- `index.html` — Home ("Pelotão"): ticker de manchetes, destaques, últimas, O Vaca Shop, WhatsApp.
- `blog/index.html` — "Novidades no Pelotão": catálogo de todas as matérias de pé, com filtros por tipo (Notícias Gerais / Radar de Tendências / Dossiê Altimetria) e por pelote (Road / MTB / Gravel / Urbano / Análises).
- `redacao/<categoria>/<slug>.html` — uma matéria por arquivo.
- `assets/css/style.css` — todo o design system (tokens em `:root`).
- `assets/js/main.js` — JS progressivo (o site funciona 100% sem ele): ticker via JSON, filtros, reveal, parallax.
- `assets/data/articles.json` — **banco de matérias**. Alimenta o ticker e registra os metadados, inclusive as `fontes` (que NÃO são exibidas nas páginas).
- `templates/article-template.html` — template de matéria com campos `{{ASSIM}}` (pasta bloqueada no robots.txt).
- `_headers`, `_redirects`, `robots.txt`, `sitemap.xml`, `404.html` — infra Cloudflare Pages.

## Deploy no Cloudflare Pages

1. Crie o projeto no Pages apontando para este repositório.
2. **Build command:** nenhum. **Output directory:** `/` (raiz deste diretório `site/`).
3. Todo push na branch de produção dispara deploy automático.
4. Domínio: aponte `ovacaciclista.com.br` no painel. O subdomínio `bikes.ovacaciclista.com.br` (loja de bikes usadas) é um projeto à parte — **CONFIGURAÇÃO EXTERNA NECESSÁRIA**.

## Fluxo do agente de publicação (novo post)

1. Copiar `templates/article-template.html` → `redacao/<categoria>/<slug>.html`.
2. Preencher todos os campos `{{ASSIM}}` (comentário CONTENT-METADATA, head, JSON-LD, corpo).
3. Adicionar entrada em `assets/data/articles.json` (título, ticker, url, pelote, tipo, iot, datas, **fontes** — só aqui).
4. Adicionar card em `blog/index.html` (copiar um `<a class="card">` existente; setar `data-tipo` e `data-pelote`).
5. Se for destaque: atualizar a seção "Destaques" da `index.html` e os itens estáticos do ticker.
6. Adicionar `<url>` no `sitemap.xml` com `lastmod`.
7. Commit + push → Cloudflare publica.

### Validações que devem FALHAR o fluxo
Sem title · sem canonical · sem description · sem H1 · sem imagem/alt · slug inválido · URL duplicada · JSON-LD inválido · data incorreta · link interno quebrado.

## Checklist de publicação
- [ ] Slug válido (minúsculas, sem acento, hífens)
- [ ] Title e meta description exclusivos
- [ ] Canonical absoluto correto
- [ ] Um único H1
- [ ] Datas de publicação/atualização corretas (formato do país no dateline)
- [ ] Categoria/pelote e tipo corretos
- [ ] Imagem principal + alt + crédito (licença verificada)
- [ ] JSON-LD NewsArticle + BreadcrumbList válidos
- [ ] Fontes registradas SÓ em articles.json
- [ ] articles.json, blog e sitemap atualizados
- [ ] Links internos funcionando
- [ ] Mobile e Lighthouse verificados

## Pendências externas (CONFIGURAÇÃO EXTERNA NECESSÁRIA)
- Link real da comunidade WhatsApp (hoje aponta para chat.whatsapp.com genérico).
- Subdomínio `bikes.ovacaciclista.com.br` (loja de bikes usadas).
- URLs reais de Instagram/YouTube.
- Imagens licenciadas para heros e cards (hoje: placeholders identificados).
- Loja própria (`/loja/`) — em construção.
- Analytics (recomendado: Cloudflare Web Analytics) — não instalado por padrão.
