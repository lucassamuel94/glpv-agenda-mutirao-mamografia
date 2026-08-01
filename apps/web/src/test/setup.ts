import "@testing-library/jest-dom/vitest";

// Node 26 expõe `localStorage` como recurso experimental e pode deixá-lo
// indisponível quando nenhum arquivo foi configurado. O app usa a API real do
// navegador; nos testes, fornecemos o contrato mínimo de Storage para que o
// ambiente do Node não sobrescreva o storage do jsdom com `undefined`.
if (typeof globalThis.localStorage === "undefined") {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => Array.from(values.keys())[index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, String(value)),
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
}

/**
 * Stubs de DOM que o jsdom não implementa e dos quais o Radix depende
 * (Select, Popover, Combobox): pointer capture, `scrollIntoView` e
 * `ResizeObserver`. Sem eles, `userEvent.click` num gatilho de Select lança
 * `TypeError: target.hasPointerCapture is not a function` — erro de AMBIENTE,
 * que não diz nada sobre o componente testado.
 *
 * Mora aqui, e não em cada arquivo de teste, porque é plumbing de ambiente:
 * qualquer teste novo que abra um dropdown precisa disso, e descobrir o motivo
 * pela mensagem do Radix custa tempo.
 *
 * **Isto REVERTE uma decisão anterior**, que estava escrita em
 * `contact-interaction-dialog.test.tsx`: "escopo LOCAL a este arquivo (não em
 * `src/test/setup.ts`) para não mudar o comportamento de outras suítes". A
 * preocupação era legítima; o que a responde é a natureza dos stubs, não uma
 * opinião contrária:
 *
 *  - cada um é guardado por `if (!...)`, então só preenche o que o jsdom NÃO
 *    implementa — nunca substitui comportamento existente de outra suíte;
 *  - são métodos que o jsdom simplesmente não tem, não pontos de extensão que
 *    algum teste possa estar usando de outra forma;
 *  - medido: as 8 cópias locais foram removidas e a suíte segue em 318/318. Se
 *    a centralização mudasse o comportamento de alguma suíte, seria aqui que
 *    apareceria.
 *
 * As 8 cópias locais existiam de antes e foram removidas junto desta
 * centralização.
 *
 * Cada stub é o mínimo que satisfaz o Radix, não uma emulação fiel: o objetivo
 * é o componente conseguir abrir e responder a clique, não reproduzir a
 * semântica de pointer capture do navegador.
 */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!(globalThis as Record<string, unknown>).ResizeObserver) {
  (globalThis as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
