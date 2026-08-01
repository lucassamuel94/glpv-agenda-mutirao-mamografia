import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Select } from "./Select";
import { Form } from "../index";

/**
 * Dívida 5 do fechamento do Plano 3 (footgun herdado do design system):
 * `renderSelectItems` gravava `value={option.value || "DEFAULT"}`.
 *
 * O `|| "DEFAULT"` existe por um motivo REAL — o `SelectItem` do Radix recusa
 * `value=""`, porque string vazia é o que ele usa internamente para "nada
 * selecionado". O defeito não era a sentinela; era ela ser **de mão única**:
 *
 *  1. escolher a opção de valor vazio devolvia a string literal `"DEFAULT"` ao
 *     formulário, em vez de `""` — corrupção silenciosa, o campo grava um valor
 *     que não existe na lista de opções;
 *  2. uma opção cujo `value` é literalmente `"DEFAULT"` COLIDIA com a opção
 *     vazia — dois itens do Radix com o mesmo value.
 *
 * O sintoma some se o desenvolvedor usar uma sentinela própria (`"NONE"`), que
 * é o contorno que `team-filters.tsx` e os formulários de tarefa aplicam. Ou
 * seja: a dívida estava sendo paga por cada consumidor, um a um, em vez de no
 * componente.
 *
 * O conserto é mapear nos DOIS sentidos, dentro do componente pai (`ui/select.tsx`
 * é read-only por regra do projeto — ver `frontend/CLAUDE.md` §1).
 */
describe("Select — opção de valor vazio", () => {
  const OPTIONS = [
    { value: "", label: "Nenhum" },
    { value: "tecnologia", label: "Tecnologia" },
  ];

  /**
   * O fluxo REAL que estava quebrado, e o motivo de o teste ser um ida-e-volta:
   * com o conserto, a opção vazia nasce SELECIONADA quando o valor é `""` (é o
   * estado verdadeiro — "Todos" num filtro não é ausência de escolha), e clicar
   * numa opção já selecionada é no-op no Radix. Quem quebrava era a VOLTA:
   * escolher um valor real e depois limpar.
   */
  it("standalone: voltar para a opção vazia reporta \"\", não a sentinela", async () => {
    const onChange = vi.fn();

    render(
      <Select name="categoria" label="Categoria" options={OPTIONS} onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole("combobox"));
    let options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Nenhum", "Tecnologia"]);

    // Sai do estado vazio...
    await userEvent.click(options[1]);
    expect(onChange).toHaveBeenLastCalledWith("tecnologia");

    // ...e volta. Antes do conserto, esta linha reportava "DEFAULT".
    await userEvent.click(screen.getByRole("combobox"));
    options = await screen.findAllByRole("option");
    await userEvent.click(options[0]);

    expect(onChange).toHaveBeenLastCalledWith("");
  });

  /**
   * Consequência boa do mapeamento de ida: a opção vazia agora APARECE
   * selecionada. Antes, `value=""` voltava ao Radix como "nada selecionado" e o
   * placeholder ficava visível mesmo com "Todos" sendo o estado efetivo do
   * filtro — a tela contradizia o dado.
   */
  it("a opção vazia aparece selecionada no gatilho, não o placeholder", async () => {
    render(
      <Select
        name="categoria"
        label="Categoria"
        options={OPTIONS}
        placeholder="Selecione..."
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Nenhum");
  });

  /**
   * A contraparte que garante que o mapeamento de ida não é cego: sem opção
   * vazia na lista, `""` continua significando "nada selecionado" e o
   * placeholder tem que aparecer.
   */
  it("sem opção vazia na lista, o placeholder continua aparecendo", async () => {
    render(
      <Select
        name="categoria"
        label="Categoria"
        options={[{ value: "tecnologia", label: "Tecnologia" }]}
        placeholder="Selecione..."
      />,
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("Selecione...");
  });

  /**
   * O caso da colisão. Sem o mapeamento de duas mãos, "Nenhum" (`value: ""`) e
   * "Padrão do sistema" (`value: "DEFAULT"`) viram DOIS itens com o mesmo value
   * — e o Radix passa a não distinguir qual foi clicado.
   */
  it("standalone: opção cujo value é literalmente \"DEFAULT\" não colide com a vazia", async () => {
    const onChange = vi.fn();
    const comColisao = [
      { value: "", label: "Nenhum" },
      { value: "DEFAULT", label: "Padrão do sistema" },
    ];

    render(
      <Select name="modo" label="Modo" options={comColisao} onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole("combobox"));
    let options = await screen.findAllByRole("option");
    await userEvent.click(options[1]);
    expect(onChange).toHaveBeenLastCalledWith("DEFAULT");

    await userEvent.click(screen.getByRole("combobox"));
    options = await screen.findAllByRole("option");
    await userEvent.click(options[0]);
    expect(onChange).toHaveBeenLastCalledWith("");
  });

  /**
   * A metade que importa de verdade para o produto: dentro de `Form`, o valor
   * que chega ao formulário (e daí ao payload da API) tem que ser `""`.
   */
  it("dentro de Form: o valor do campo volta a \"\", não à sentinela", async () => {
    const onChange = vi.fn();

    render(
      <Form onSubmit={() => {}} onChange={onChange} showDefaultButtons={false}>
        <Select name="categoria" label="Categoria" options={OPTIONS} />
      </Form>,
    );

    await userEvent.click(screen.getByRole("combobox"));
    let options = await screen.findAllByRole("option");
    await userEvent.click(options[1]);

    await waitFor(() => {
      expect(onChange.mock.calls.at(-1)?.[0].categoria).toBe("tecnologia");
    });

    await userEvent.click(screen.getByRole("combobox"));
    options = await screen.findAllByRole("option");
    await userEvent.click(options[0]);

    // É este valor que iria no payload da API. Antes: "DEFAULT".
    await waitFor(() => {
      expect(onChange.mock.calls.at(-1)?.[0].categoria).toBe("");
    });
  });

  /** Regressão: opção normal segue reportando o próprio value. */
  it("opção comum não é afetada pelo mapeamento", async () => {
    const onChange = vi.fn();

    render(
      <Select name="categoria" label="Categoria" options={OPTIONS} onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole("combobox"));
    const options = await screen.findAllByRole("option");
    await userEvent.click(options[1]);

    expect(onChange).toHaveBeenCalledWith("tecnologia");
  });
});
