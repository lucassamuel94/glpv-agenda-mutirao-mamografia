# Shell inspirado no Linear — especificação de design

Data: 2026-07-29

## 1. Objetivo

Refinar o shell autenticado do EZ Starter Kit para aproximá-lo da linguagem
visual do Linear: compacto, neutro, silencioso e operacional. A referência
orienta proporção, densidade, hierarquia, cores e acabamento, sem copiar marca,
conteúdo, arquitetura de informação ou funcionalidades específicas.

Esta entrega cobre somente a fundação visual e estrutural compartilhada:
tokens globais, sidebar, topbar, moldura do conteúdo e cabeçalho das páginas.
As telas internas serão migradas em uma etapa posterior, usando esta fundação
já validada.

## 2. Princípios aprovados

- Inter permanece como fonte principal.
- Indigo é reservado para ação, foco e pequenos detalhes de marca.
- Seleção de navegação usa contraste neutro, sem barra lateral colorida.
- Light e dark mode compartilham geometria, densidade e hierarquia.
- A interface prioriza superfícies contínuas, divisores sutis e poucos efeitos.
- O produto deve lembrar a disciplina visual do Linear sem parecer uma cópia.
- Rotas, permissões, dados, atalhos e regras de negócio são preservados.
- Mobile continua sendo uma experiência suportada por drawer acessível.

## 3. Abordagem

A implementação será uma adaptação sistêmica equilibrada. O shell atual será
evoluído, não reconstruído:

1. calibrar tokens semânticos de light e dark mode;
2. atualizar a geometria do `Layout`;
3. compactar e neutralizar a `Sidebar`;
4. integrar a topbar à superfície principal;
5. ajustar `AppBrand` e `PageHeader` à nova densidade;
6. validar o shell antes de migrar superfícies internas.

Os componentes primitivos em `apps/web/src/components/ui/` permanecem
inalterados. Qualquer ajuste será feito nos componentes pais e nos tokens.

## 4. Fundação visual

### 4.1. Cores

No tema claro:

- fundo externo do aplicativo: cinza neutro muito claro;
- sidebar: cinza suave, próxima ao fundo externo;
- superfície principal: branco levemente frio;
- superfície secundária: cinza muito claro;
- bordas: cinza neutro de baixo contraste;
- texto principal: carvão, sem tonalidade azul evidente;
- texto secundário: cinza médio com contraste legível;
- item ativo: preenchimento cinza neutro;
- hover: preenchimento neutro mais discreto que o ativo.

No tema escuro:

- fundo externo e sidebar: preto neutro;
- superfície principal: preto elevado, sem azul;
- superfícies secundárias: cinza muito escuro;
- bordas: cinza escuro visível apenas o suficiente para estruturar;
- texto principal: branco suavizado;
- texto secundário: cinza claro;
- item ativo: cinza escuro, sem brilho.

As cores semânticas existentes continuam destinadas a sucesso, informação,
alerta e perigo. Não haverá gradientes, glow ou glass effect no shell.

### 4.2. Tipografia

- navegação e topbar: 13px, peso 450–500;
- títulos de grupos: 11–12px, peso 500, sem caixa-alta obrigatória;
- metadados: 12px;
- título principal da página: aproximadamente 20–22px, peso 600;
- descrição da página: 13–14px;
- line-height compacta nos controles e confortável no conteúdo;
- tracking sutil, evitando aparência excessivamente condensada.

### 4.3. Espaçamento e forma

- unidade predominante: múltiplos de 4px;
- itens de navegação: 30–32px de altura;
- ícones: 15–16px;
- raio de controles e itens: 6–8px;
- raio da superfície principal: 10–12px;
- bordas de 1px;
- sombras somente onde a profundidade ajuda: moldura principal muito discreta,
  menus, popovers e diálogos.

## 5. Estrutura do shell

### 5.1. Desktop

- sidebar expandida com aproximadamente 236px;
- sidebar recolhida com 64px;
- espaçamento externo de 8px entre viewport, sidebar e superfície principal;
- superfície principal ocupa o espaço restante dentro de uma moldura contínua;
- a moldura contém topbar e conteúdo, com `overflow` controlado internamente;
- o raio e a borda da moldura ficam visíveis nos quatro lados;
- o conteúdo continua limitado a aproximadamente 1280px quando a tela não
  solicitar modo `full`.

A moldura deve desaparecer em contextos de impressão. O modo Zen continua
funcional e remove a navegação sem quebrar a geometria do conteúdo.

### 5.2. Tablet e mobile

- abaixo de 768px, a sidebar permanece como drawer;
- o conteúdo ocupa toda a largura, sem uma margem ornamental que desperdice
  espaço;
- a topbar mantém o botão textual ou iconográfico de abertura com nome
  acessível;
- o drawer fecha por backdrop, botão de fechar, navegação e tecla Escape;
- foco retorna ao controle de abertura após o fechamento;
- nenhuma largura mínima bloqueia a aplicação;
- não há rolagem horizontal da página.

## 6. Sidebar

### 6.1. Cabeçalho

- altura aproximada de 48px;
- marca compacta, alinhada aos itens de navegação;
- wordmark entre 13–14px, peso 600;
- logo da organização continua prevalecendo quando configurado;
- controle de recolhimento é discreto e possui tooltip e nome acessível.

### 6.2. Navegação

- grupos separados principalmente por espaçamento, não por caixas;
- títulos de grupo discretos e legíveis;
- itens com padding horizontal de 8–10px;
- ícone e rótulo separados por 8px;
- item ativo com fundo neutro e texto principal;
- item inativo com texto secundário;
- hover intermediário entre o estado normal e ativo;
- nenhum contorno luminoso, barra indigo ou ícone colorido apenas por estar
  ativo;
- submenus usam recuo e hierarquia tipográfica, com divisor somente quando
  necessário;
- tooltips continuam disponíveis no estado recolhido.

Os itens de Style Guide e Form Guide continuam visíveis somente em
desenvolvimento.

### 6.3. Organização e usuário

- o banner de organização é tratado como contexto, não como card promocional;
- nome, plano e organização truncam corretamente;
- o rodapé do usuário mantém avatar, nome e ação de expansão em uma única linha;
- o menu do usuário utiliza superfície sólida, borda e sombra discreta;
- ações destrutivas mantêm vermelho apenas no item correspondente.

## 7. Topbar

- altura entre 48–52px;
- integrada à moldura principal;
- fundo sólido, sem blur ou transparência;
- divisor inferior sutil;
- título contextual compacto à esquerda;
- comandos globais à direita;
- separadores usados apenas entre grupos funcionais;
- ações próprias da página permanecem no cabeçalho em fluxo, não na topbar;
- no mobile, o botão de menu antecede o contexto da página;
- estados de loading preservam a geometria para evitar saltos.

## 8. Cabeçalho da página

O `PageHeader` continua publicando o título contextual no slot persistente do
shell, mas mantém título, descrição e ações principais dentro da página.

- margem superior reduzida devido à topbar mais compacta;
- título entre 20–22px;
- descrição com largura controlada e contraste suficiente;
- ações alinhadas à direita no desktop;
- ações quebram para a linha seguinte em telas estreitas;
- botão voltar mantém área de toque de pelo menos 40px;
- páginas em loading preservam título e estrutura.

## 9. Estados e movimento

- transições limitadas a cor, opacidade, largura e transformação do drawer;
- duração entre 120–180ms para hover e 180–220ms para drawer/recolhimento;
- `prefers-reduced-motion` desativa movimentos não essenciais;
- foco utiliza ring indigo visível em light e dark;
- estados disabled mantêm legibilidade e não dependem apenas de opacidade;
- não haverá animação vertical, shine, glow ou pulso decorativo.

## 10. Acessibilidade

- contraste AA para texto e controles essenciais;
- alvos de toque de pelo menos 40px em mobile;
- sidebar e drawer possuem nome acessível;
- o controle de recolhimento expõe estado e ação;
- navegação ativa utiliza `aria-current`;
- dropdowns expõem `aria-expanded` e relação com seus submenus;
- Escape fecha drawer e menus;
- ordem de tabulação acompanha a ordem visual;
- foco não fica preso ou perdido após navegação e fechamento;
- truncamento oferece o valor completo por tooltip quando necessário.

## 11. Componentes e arquivos em escopo

- `apps/web/src/app/globals.css`
- `apps/web/src/components/Layout.tsx`
- `apps/web/src/components/Sidebar.tsx`
- `apps/web/src/components/AppBrand.tsx`
- `apps/web/src/components/PageHeader.tsx`
- testes e stories correspondentes;
- documentação do Style Guide e metadados MCP afetados.

`apps/web/src/components/ui/` está explicitamente fora do escopo.

## 12. Fora do escopo

- reorganizar rotas ou grupos de permissão;
- copiar funcionalidades do Linear;
- alterar regras de negócio, APIs ou schemas;
- redesenhar individualmente tabelas, formulários e diálogos;
- introduzir novos ícones, ilustrações ou ativos decorativos;
- remover o modo Zen, sistema de ajuda ou troca de organização;
- publicar ou implantar a aplicação.

## 13. Validação

### Testes automatizados

- sidebar expandida, recolhida e em drawer;
- fechamento por botão, backdrop e Escape;
- retorno de foco ao acionador;
- itens de desenvolvimento ausentes em produção;
- item atual identificado semanticamente;
- PageHeader com descrição e ações responsivas;
- Layout sem bloqueio por largura;
- atalhos existentes preservados.

### Verificação visual

Comparar implementação e referências lado a lado nos mesmos estados:

- 390×844, light e dark;
- 768×1024, light e dark;
- 1440×900, light e dark;
- 2056×1082, light e dark;
- sidebar expandida e recolhida;
- drawer aberto e fechado;
- menu do usuário e troca de organização;
- página padrão, loading e modo Zen.

### Critérios de aceite

- sidebar clara é neutra, não azul-marinho;
- dark mode usa neutros sem tonalidade azul predominante;
- item ativo é neutro e não possui barra indigo;
- topbar mede no máximo 52px;
- superfície principal forma uma moldura contínua no desktop;
- navegação mantém densidade de 30–32px por item;
- nenhuma página ganha rolagem horizontal;
- drawer é utilizável por teclado;
- rotas, permissões, atalhos e comportamento permanecem inalterados;
- não há alterações em `src/components/ui/`;
- comparação visual não apresenta divergências P0, P1 ou P2.

## 14. Sequência de implementação posterior

1. testes comportamentais que faltam no shell;
2. tokens light/dark e movimento reduzido;
3. geometria do Layout e topbar;
4. sidebar expandida, recolhida e drawer;
5. AppBrand e PageHeader;
6. stories, catálogo e documentação;
7. lint, typecheck, testes, build e cobertura de stories;
8. QA visual comparativa até aprovação.
