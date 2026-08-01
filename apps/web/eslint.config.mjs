import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import storybook from "eslint-plugin-storybook";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...storybook.configs["flat/recommended"],
  {
    rules: {
      // "error" desde 2026-07-28, quando o refactor levou o template a ZERO
      // ocorrências — antes eram 35 pré-existentes e as regras ficavam em "warn"
      // (o projeto de referência ez-call fez o mesmo caminho em 2026-05-21).
      //
      // Como as 35 foram resolvidas, porque isto muda o que fazer com a próxima:
      //
      //  - a maioria era "resetar estado local quando uma prop muda", que virou
      //    `useResetOnChange` — o padrão oficial do React (ajustar estado durante
      //    o render), sem o quadro pintado com o valor antigo que o efeito deixava;
      //  - duas eram estado DERIVADO disfarçado de estado (`isViewingAsOrganization`
      //    em `use-auth`, `role` em `usePermission`): sumiram, não foram silenciadas;
      //  - o restante é sincronização com sistema EXTERNO (API, socket, store de
      //    preferências, react-hook-form) ou a hidratação servidor→cliente. Nesses
      //    o efeito é a ferramenta correta e a regra é falso positivo: cada um tem
      //    `eslint-disable-next-line` com a razão escrita ao lado.
      //
      // Ou seja: `disable` aqui é decisão registrada, não dívida escondida. Se
      // você precisar de um novo, escreva o porquê — se o porquê for "não sei
      // como tirar do efeito", provavelmente é `useResetOnChange`.
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/exhaustive-deps": "error",
      "react-hooks/immutability": "error",
      // Regras novas do react-hooks v6 com muito falso-positivo em código
      // legitimamente complexo (hooks genéricos, state machines). Reabrir
      // caso a caso quando for tocar nos arquivos.
      "react-hooks/refs": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/globals": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
