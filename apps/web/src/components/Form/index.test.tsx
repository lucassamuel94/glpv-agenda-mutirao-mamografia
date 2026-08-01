import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Form } from "./index";
import { Input } from "./Fields/Input";

/**
 * Cobertura do prop `onChange` do `Form`.
 *
 * Bug histórico (Task 5, DynamicFieldsForm): dois `useEffect` compartilhavam
 * a mesma `previousValuesRef`. O effect de campos obrigatórios rodava
 * primeiro e mutava a ref para o valor atual; o effect de `onChange` então
 * sempre encontrava a ref já igual ao valor atual e a comparação nunca
 * detectava mudança — `onChange` nunca disparava, para nenhum consumidor.
 * Estes testes existem para que essa regressão nunca mais passe em silêncio.
 */
describe("Form onChange", () => {
  it("dispara ao digitar em um campo, recebendo os valores atuais", async () => {
    const onChange = vi.fn();

    render(
      <Form onSubmit={() => {}} onChange={onChange} showDefaultButtons={false}>
        <Input id="nome" name="nome" label="Nome" />
      </Form>,
    );

    await userEvent.type(screen.getByLabelText("Nome"), "Ana");

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled();
    });

    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last.nome).toBe("Ana");
  });

  it("não dispara no render inicial, sem nenhuma interação do usuário", async () => {
    const onChange = vi.fn();

    render(
      <Form
        onSubmit={() => {}}
        onChange={onChange}
        defaultValues={{ nome: "valor inicial" }}
        showDefaultButtons={false}
      >
        <Input id="nome" name="nome" label="Nome" />
      </Form>,
    );

    // Dá tempo para os efeitos do Form rodarem (inclusive o debounce de
    // 300ms da validação de obrigatórios), sem qualquer interação.
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("não entra em loop: para de disparar quando a interação para", async () => {
    const onChange = vi.fn();

    render(
      <Form onSubmit={() => {}} onChange={onChange} showDefaultButtons={false}>
        <Input id="nome" name="nome" label="Nome" />
      </Form>,
    );

    await userEvent.type(screen.getByLabelText("Nome"), "A");
    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const callsRightAfterTyping = onChange.mock.calls.length;

    // Sem nenhuma outra interação, o número de chamadas não pode continuar
    // crescendo sozinho (isso indicaria um loop de render/effect).
    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(onChange.mock.calls.length).toBe(callsRightAfterTyping);
  });
});

/**
 * Cobertura do effect de campos obrigatórios (`checkRequiredFieldsFilled`) —
 * a outra metade do emaranhado de refs. Precisa continuar funcionando depois
 * do conserto do `onChange`, já que os dois efeitos compartilhavam estado.
 */
describe("Form validação de campos obrigatórios", () => {
  it("reporta válido quando não há campos obrigatórios", async () => {
    const onValidationChange = vi.fn();

    render(
      <Form
        onSubmit={() => {}}
        onValidationChange={onValidationChange}
        showDefaultButtons={false}
      >
        <Input name="nome" label="Nome" />
      </Form>,
    );

    await waitFor(() =>
      expect(onValidationChange).toHaveBeenCalledWith(true, {}),
    );
  });

  it("com campo obrigatório, preencher dispara onValidationChange(true, {})", async () => {
    // NOTA: não afirmamos aqui um onValidationChange(false, {}) inicial, no
    // mount, com o campo obrigatório ainda vazio. Investigando este item foi
    // descoberto que esse check inicial tem uma falha PRÉ-EXISTENTE e
    // INDEPENDENTE do bug do onChange: o registro do campo obrigatório
    // (efeito de `FormControl`, no filho) roda e re-renderiza o `Form` DEPOIS
    // do efeito de validação já ter agendado seu `setTimeout` — o cleanup
    // desse efeito cancela o timeout agendado, e como `previousValidationValuesRef`
    // já está igual a `valuesString` (nenhum valor mudou), o efeito não
    // reagenda. Resultado: com um campo obrigatório presente desde o mount
    // (vazio OU já preenchido via defaultValues), a validação inicial nunca
    // roda — só volta a funcionar quando ALGUM valor muda. Esse é um defeito
    // separado do relatado nesta tarefa; não foi corrigido aqui (fora de
    // escopo) e foi reportado para avaliação. Este teste cobre o caminho que
    // continua funcionando: reagir a uma mudança de valor.
    const onValidationChange = vi.fn();

    render(
      <Form
        onSubmit={() => {}}
        onValidationChange={onValidationChange}
        showDefaultButtons={false}
      >
        <Input id="nome" name="nome" label="Nome" required />
      </Form>,
    );

    await userEvent.type(screen.getByLabelText(/Nome/), "Ana");

    await waitFor(() =>
      expect(onValidationChange).toHaveBeenCalledWith(true, {}),
    );
  });
});

/**
 * `disableFormElement` — item 5 da rodada de correção pós-merge: o diálogo
 * de contato (e o de empresa, mesmo padrão) tinha `<form>` dentro de
 * `<form>` sempre que a organização tinha algum campo customizado
 * (`ContactForm`/`CompanyForm` envolvem `DynamicFieldsForm`, que também
 * renderiza um `Form`). HTML inválido, e quebra o Enter-para-enviar dentro
 * de um campo customizado (ver docstring do prop).
 *
 * Linha de produção que deixa isto vermelho: remover a condicional
 * `disableFormElement ? <div>...</div> : <form>...</form>` e sempre
 * renderizar `<form>`.
 */
describe("Form disableFormElement", () => {
  it("por padrão (ausente) renderiza uma tag <form>", () => {
    const { container } = render(
      <Form onSubmit={() => {}} showDefaultButtons={false}>
        <Input id="nome" name="nome" label="Nome" />
      </Form>,
    );

    expect(container.querySelectorAll("form")).toHaveLength(1);
  });

  it("true renderiza <div> no lugar de <form>", () => {
    const { container } = render(
      <Form onSubmit={() => {}} showDefaultButtons={false} disableFormElement>
        <Input id="nome" name="nome" label="Nome" />
      </Form>,
    );

    expect(container.querySelectorAll("form")).toHaveLength(0);
  });

  it("aninhado dentro de outro Form, o INTERNO com disableFormElement não produz <form> aninhado — só o de fora existe", () => {
    const { container } = render(
      <Form onSubmit={() => {}} showDefaultButtons={false}>
        <Input id="externo" name="externo" label="Campo externo" />
        <Form onSubmit={() => {}} showDefaultButtons={false} disableFormElement>
          <Input id="interno" name="interno" label="Campo customizado" />
        </Form>
      </Form>,
    );

    expect(container.querySelectorAll("form")).toHaveLength(1);
  });
});
