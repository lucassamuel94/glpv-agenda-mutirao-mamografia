import { useState } from "react";

/**
 * Executa `reset` quando `value` muda — **durante o render**, não num efeito.
 *
 * ## O problema que isto resolve
 *
 * O padrão mais comum deste projeto era:
 *
 * ```tsx
 * useEffect(() => {
 *   if (open) setReason("");   // limpa o campo a cada abertura
 * }, [open]);
 * ```
 *
 * Funciona, mas o efeito roda **depois** do render e do paint: existe um quadro
 * em que o diálogo já está visível mostrando o valor ANTIGO, e só então o estado
 * é limpo. Num diálogo que abre, isso é visível — o motivo da oportunidade
 * anterior aparece por um instante. É exatamente o que a regra
 * `react-hooks/set-state-in-effect` existe para apontar.
 *
 * ## Por que durante o render é correto (e não um hack)
 *
 * Chamar `setState` durante o render do PRÓPRIO componente é um padrão
 * documentado pelo React ("adjusting state when a prop changes"): o React
 * descarta o render em andamento e re-renderiza imediatamente com o novo estado,
 * **antes** de pintar. O usuário nunca vê o valor antigo, e não há efeito nem
 * segunda passada visível.
 *
 * A restrição que faz isso ser seguro: `reset` só pode mexer no estado do
 * componente que chamou o hook. Disparar estado de outro componente durante o
 * render é o caso que o React proíbe de verdade.
 *
 * ## Por que um hook, e não o padrão copiado em cada arquivo
 *
 * Escrito à mão, cada uso vira quatro linhas (`prev` state + comparação +
 * `setPrev` + o reset) e a justificativa some ou é repetida errada. Eram 20+
 * lugares no projeto. Com o hook, cada um é uma linha e o porquê mora aqui.
 *
 * ## ⚠️ NÃO roda no mount — só na MUDANÇA
 *
 * `previous` nasce igual a `value`, então o primeiro render nunca chama `reset`.
 * **Esta é a diferença que quebrou a sidebar em 2026-07-28** e vale ler antes de
 * usar o hook como substituto de um efeito: `useEffect(fn, [x])` roda no mount E
 * na mudança; este hook roda só na mudança.
 *
 * Se a passada de mount fazia parte do trabalho, trocar o efeito por este hook
 * SILENCIA essa metade. Foi o que aconteceu em `usePermission`/`Sidebar`: eles
 * semeavam estado do `localStorage` e o efeito copiava o usuário da sessão em
 * cima — sem a passada de mount, o estado ficava preso no valor do storage,
 * `can()` devolvia `false` para tudo e o menu renderizava vazio, sem erro algum.
 *
 * A pergunta a fazer antes de converter: **o `useState` é inicializado com o
 * MESMO valor que o sync escreveria?** Se sim, a passada de mount era no-op e a
 * troca é segura (é o caso dos filtros e dos diálogos). Se não, o estado tem
 * outra origem e o certo é DERIVAR o valor, não espelhá-lo — ver o `role` em
 * `usePermission` e o `currentUser` em `Sidebar`.
 *
 * ## Quando NÃO usar
 *
 * - Se o reset depende de dado ASSÍNCRONO (resposta de API), continua sendo
 *   efeito — `setState` em callback de promise é o uso legítimo, e a regra não
 *   reclama dele.
 * - Se o estado é função pura de outra coisa, não use hook nenhum: derive. Estado
 *   derivado duplicado é o que dessincroniza.
 * - Se o componente pode simplesmente não ser montado enquanto fechado
 *   (`{open && <Dialog/>}`), isso é melhor ainda: estado novo por construção,
 *   sem hook nenhum. Não é o caso dos diálogos deste projeto, que ficam
 *   montados para animar a saída.
 *
 * @example
 * ```tsx
 * const [reason, setReason] = useState("");
 * // Limpa a cada abertura, sem efeito e sem quadro com o valor antigo.
 * useResetOnChange(open, () => setReason(""));
 * ```
 */
export function useResetOnChange<T>(value: T, reset: () => void): void {
  const [previous, setPrevious] = useState(value);

  if (value !== previous) {
    setPrevious(value);
    reset();
  }
}
