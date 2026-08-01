---
name: EZCRM Frontend Template
description: Design system border-first, moderno e premium, para produtos SaaS B2B
colors:
  signal-indigo: "hsl(239 84% 67%)"
  signal-indigo-hover: "#4338ca"
  void-slate: "hsl(222 47% 11%)"
  void-slate-dark: "hsl(0 0% 8%)"
  cool-slate-bg: "hsl(0 0% 100%)"
  cool-slate-bg-dark: "hsl(0 0% 6%)"
  cool-slate-card: "hsl(0 0% 100%)"
  cool-slate-card-dark: "hsl(0 0% 8%)"
  cool-slate-secondary: "hsl(210 20% 96%)"
  cool-slate-secondary-dark: "hsl(0 0% 12%)"
  cool-slate-muted: "hsl(210 20% 94%)"
  cool-slate-muted-dark: "hsl(0 0% 12%)"
  cool-slate-border: "hsl(214 24% 90%)"
  cool-slate-border-dark: "hsl(0 0% 11%)"
  foreground: "hsl(222.2 47.4% 11.2%)"
  foreground-dark: "hsl(0 0% 95%)"
  destructive: "hsl(0 84.2% 60.2%)"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.022em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.022em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.011em"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "-0.011em"
  micro:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0"
rounded:
  sm: "calc(0.5rem - 4px)"
  md: "calc(0.5rem - 2px)"
  lg: "0.5rem"
  xl: "0.75rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-indigo}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "{colors.signal-indigo-hover}"
  button-outline:
    backgroundColor: "{colors.cool-slate-bg}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
  input:
    backgroundColor: "{colors.cool-slate-card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.cool-slate-card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
---

# Design System: EZCRM Frontend Template

## Overview

**Creative North Star: "The Signal Console"**

Linha moderna e premium de produto SaaS B2B, na família visual de Linear, ClickUp e Stripe — mas com identidade própria, sem copiar seus componentes ou estilos diretamente. É border-first: em vez de sombra para separar superfícies, uma borda de 1px nítida faz o trabalho, com cantos suavemente arredondados (8px) que evitam tanto o quadrado agressivo quanto o pill genérico. O layout é limpo e organizado sem parecer vazio: densidade moderada de informação, respiração calculada (escala de spacing de 8px a 48px), tipografia com tracking levemente negativo para legibilidade em telas de dados.

Cor tem função, não decoração: Signal Indigo aparece só em ação primária, foco e estados de destaque — o resto da interface é neutro (Cool Slate). Efeitos decorativos (glass, glow, micro-elevação) existem mas são usados com moderação, reservados a momentos de feedback (foco de input, toast, celebração), nunca como base do layout.

**Key Characteristics:**
- Border-first: bordas de 1px fazem o trabalho que sombra faria em outros sistemas
- Uma cor de ação (Signal Indigo), tudo o mais é neutro
- Densidade moderada — nem denso demais (fadiga), nem vazio (parece incompleto)
- Dark mode não é "light mode escurecido": preto quase puro (#080808) com hierarquia própria de cinzas
- Efeitos decorativos (glow, glass) são resposta a estado, não ornamento em repouso

## Colors

Paleta funcional: um único acento vibrante contra uma base neutra fria (slate), com o sidebar como âncora escura mesmo no tema claro.

### Primary
- **Signal Indigo** (`hsl(239 84% 67%)` / `#4f46e5`): ação primária (botões, links), anel de foco, indicadores de progresso. É o único elemento "quente"/vibrante permitido na tela — sua raridade é o que dá força ao sinal.
- **Signal Indigo Hover** (`#4338ca`): estado hover/active do primário, mesmo hue, mais escuro.

### Neutral
- **Void Slate** (`hsl(222 47% 11%)` / `#0f172a` light · `hsl(0 0% 8%)` dark): fundo do sidebar — âncora escura estável, independe do tema da área de conteúdo.
- **Cool Slate — Background** (`hsl(0 0% 100%)` light · `hsl(0 0% 6%)` / `#080808` dark): fundo da área de conteúdo.
- **Cool Slate — Card** (`hsl(0 0% 100%)` light · `hsl(0 0% 8%)` / `#141414` dark): superfície de cards/popovers, distinta do background por tom, não por sombra.
- **Cool Slate — Secondary/Muted** (`hsl(210 20% 96%)` light · `hsl(0 0% 12%)` dark): fundos de elementos secundários e estados muted.
- **Cool Slate — Border** (`hsl(214 24% 90%)` light · `hsl(0 0% 11%)` dark): bordas de 1px que definem toda separação entre superfícies.
- **Foreground** (`hsl(222.2 47.4% 11.2%)` light · `hsl(0 0% 95%)` dark): texto principal, alto contraste sobre Cool Slate.

### Destructive
- **Destructive Red** (`hsl(0 84.2% 60.2%)` light · mais intenso no dark): exclusão, erro, estados críticos — segunda cor com função semântica fixa, nunca decorativa.

### Named Rules
**The One Signal Rule.** Signal Indigo aparece só em ação primária, foco e destaque de estado — nunca em decoração ou preenchimento de área. Se está colorido e não é ação/estado, está errado.

**The Border-Over-Shadow Rule.** Separação entre superfícies é feita por borda de 1px (`--border-width`) e diferença de tom, não por `box-shadow`. Sombra é reservada a resposta de estado (foco, toast, celebração).

## Typography

**Body/UI Font:** Inter (fallback: sans-serif)

**Character:** Uma única família tipográfica para toda a interface — Inter é neutra, densa o suficiente para tabelas e dashboards, e tem números tabulares (`font-variant-numeric: tabular-nums`) para alinhar valores em colunas.

### Hierarchy
- **Display** (800, 2.25rem/36px, line-height 1.1): números grandes de estado (ex. código de erro em `error-screen.tsx`), uso raro e só quando o número É a mensagem.
- **Headline** (600, 1.25rem/20px, line-height 1.3, letter-spacing -0.022em): títulos de página (`h1`, `PageHeader`).
- **Title** (600, 1.125rem/18px, line-height 1.3): títulos de card e seção (`h2`–`h3`).
- **Body** (400, 0.875rem/14px base, line-height 1.5, letter-spacing -0.011em): texto de interface, formulários, tabelas — é o tamanho mais usado no app (`text-sm`, ~400 ocorrências).
- **Label** (500, 0.75rem/12px, line-height 1.4): rótulos de campo, texto de botão, badges (`text-xs`).
- **Micro** (500, 0.625rem/10px, line-height 1.3): metadados de altíssima densidade (contadores em badge, células compactas de tabela) — usar com moderação, é o degrau mínimo legível, não o padrão.

### Named Rules
**The Tabular Numbers Rule.** Qualquer número em tabela, card de métrica ou dashboard usa `font-variant-numeric: tabular-nums` — colunas de valor alinham verticalmente sem esforço de leitura.

**The Body-First Rule.** Body (14px) é o tamanho padrão de qualquer texto novo; subir pra Title/Headline exige que o elemento seja de fato um título de card/página, descer pra Label/Micro exige justificativa de densidade (badge, metadado secundário) — nunca escolha por "parecer pequeno o suficiente".

## Layout

Spacing em escala de 8px (`--spacing-xs` 8px até `--spacing-2xl` 48px), aplicada via classes semânticas (`space-card`, `container-relaxed`, `stack`) em vez de valores soltos de Tailwind. Sidebar fixo à esquerda (Void Slate) + header fixo `top-0` persistente entre navegações (Portal via `PageHeader`, ver CLAUDE.md) + área de conteúdo com fundo próprio (`--main-bg`), separado do branco puro dos cards. Alturas de input/botão padronizadas em 5 degraus (40/44/48/52/56px) para nunca haver desalinhamento vertical entre campo e botão adjacente.

## Elevation & Depth

Camadas tonais leves, não sombra. A distinção entre fundo e card/popover vem de diferença de luminosidade (ex.: `#080808` background vs `#141414` card no dark), reforçada por borda de 1px — não por `box-shadow` estrutural. Sombra aparece só como reação a estado: glow de foco em input (`0 0 0 3px hsl(var(--ring)/0.08)`), edge-glow colorido em toast por tipo (success/error/warning/info), pulso em onboarding highlight. Cards têm um `shadow-sm` residual quase imperceptível — vestigial, não a fonte primária de profundidade.

### Shadow Vocabulary
- **Card ambient** (`0 1px 3px 0 rgba(0,0,0,0.05)`): sombra quase invisível em cards, coadjuvante da borda.
- **Focus ring** (`0 0 0 3px hsl(var(--ring)/0.08)` light, `/0.12` dark): resposta de foco em input/select/textarea.
- **Toast edge-glow** (ex. success `0 4px 16px rgba(16,185,129,0.2), 0 0 0 1px rgba(16,185,129,0.25)`): cor semântica só no momento da notificação.

### Named Rules
**The Flat-By-Default Rule.** Superfícies em repouso são planas com borda; sombra só aparece como resposta a estado (foco, notificação, celebração), nunca em repouso.

## Shapes

Radius consistente de 8px (`--radius: 0.5rem`) em cards e containers maiores, com degraus derivados para elementos internos (`md` = radius-2px, `sm` = radius-4px) — nunca pill (`rounded-full`) fora de avatares/badges. Bordas são sempre 1px por padrão (`--border-width`), com variante 2px (`--border-width-thick`) reservada a ênfase pontual. Nenhum corte diagonal ou geometria assimétrica — o vocabulário de forma é retangular com cantos suavizados.

## Components

### Buttons
- **Shape:** cantos suaves (`rounded-md`, ~6px), altura fixa igual à de inputs (40px default via `--input-height`)
- **Primary:** fundo Signal Indigo, texto branco, `shadow` sutil, hover escurece para `#4338ca`
- **Outline/Secondary/Ghost/Link:** variantes existentes (`buttonVariants` em `ui/button.tsx`) — outline usa borda + fundo neutro, ghost só reage no hover, link remove decoração de botão
- **Foco:** anel de 1px na cor `--ring` (mesma hue do primário) + `box-shadow` de reforço, consistente em todo elemento clicável (`button:focus-visible`, `[role="button"]:focus-visible`)

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px)
- **Background:** `bg-card`, tom levemente distinto do background da página
- **Shadow Strategy:** `shadow-sm` residual — ver Elevation & Depth
- **Border:** 1px, cor `--border`
- **Internal Padding:** `py-6 px-6` (escala `spacing-lg`)

### Inputs / Fields
- **Style:** borda de 1px proeminente (`border-input`), fundo `bg-card` no light / `bg-secondary` no dark, `rounded-lg`, altura padronizada (40px default, degraus até 56px)
- **Focus:** borda muda para `--primary` + glow de 3px (`box-shadow` duplo, mais intenso no dark) — nunca só outline nu
- **Error / Disabled:** readonly usa `bg-secondary/50` + `text-muted-foreground`, sem interatividade (`pointer-events: none`)

### Navigation (Sidebar)
- Fundo Void Slate (independe do tema de conteúdo — sempre escuro), texto branco/cinza-claro, leve realce de luz na borda direita (`sidebar-refined`, `inset -1px 0 0 rgba(255,255,255,0.04)`) em vez de sombra projetada. Permanece montado entre navegações (nunca remonta) — ver seção 2.1 do CLAUDE.md.

## Do's and Don'ts

### Do:
- **Do** usar borda de 1px + diferença de tom para separar superfícies, guardando sombra para resposta de estado (The Border-Over-Shadow Rule).
- **Do** restringir Signal Indigo a ação primária, foco e destaque de estado (The One Signal Rule).
- **Do** manter alturas de input/botão nos 5 degraus padronizados (40/44/48/52/56px) para alinhamento vertical.
- **Do** se inspirar na qualidade visual de Linear, ClickUp e Stripe (densidade, clareza, acabamento), mantendo identidade própria.

### Don't:
- **Don't** copiar componentes ou estilos de Linear/ClickUp/Stripe diretamente — inspiração de qualidade, não replicação visual.
- **Don't** introduzir `box-shadow` estrutural em repouso (cards, containers) — a separação é borda + tom.
- **Don't** usar mais de uma cor vibrante por tela fora de estados semânticos fixos (destructive vermelho, success/warning/info nos toasts).
- **Don't** deixar a interface parecer vazia por excesso de whitespace — densidade moderada é o alvo, não minimalismo extremo.
