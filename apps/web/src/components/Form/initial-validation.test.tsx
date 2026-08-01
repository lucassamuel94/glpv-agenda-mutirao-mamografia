import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Form } from "./index";
import { Input } from "./Fields/Input";

/**
 * Dívida 5 do fechamento do Plano 2: quando um campo `required` já vem
 * PREENCHIDO desde o mount (todo formulário de edição), a checagem inicial de
 * obrigatórios não rodava e `isValid`/`onValidationChange` ficavam presos em
 * `false` até o usuário digitar algo.
 *
 * A causa é uma corrida entre duas coisas que acontecem no mesmo mount:
 *
 *  1. render 1 — `requiredFields` está VAZIO (nenhum campo se registrou ainda);
 *     a guarda `previousValidationValuesRef.current !== valuesString` passa
 *     (ref começa `undefined`), agenda o `setTimeout` de 300ms com um closure
 *     que captura o conjunto vazio, e marca a ref com `valuesString`;
 *  2. os campos montam e chamam `registerRequiredField` → `requiredFields`
 *     muda → `checkRequiredFieldsFilled` ganha identidade nova → o effect
 *     re-roda: o **cleanup cancela o timeout agendado**, e a guarda agora
 *     FALHA (a ref já é igual a `valuesString`), então nada é reagendado.
 *
 * Resultado: com o formulário preenchido e o usuário sem digitar, `valuesString`
 * nunca muda, a guarda nunca volta a passar, e a checagem nunca roda.
 *
 * Não travava submit em produção porque nenhuma tela consumia
 * `isValid`/`onValidationChange` (conferido em 2026-07-28: os únicos usos estão
 * no próprio `Form` e nos testes). É dívida de componente esperando o primeiro
 * consumidor — que é o pior momento para descobrir.
 */
describe("Form — checagem inicial de obrigatórios", () => {
  it("campo obrigatório JÁ PREENCHIDO no mount reporta válido, sem interação", async () => {
    const onValidationChange = vi.fn();

    render(
      <Form
        onSubmit={() => {}}
        onValidationChange={onValidationChange}
        defaultValues={{ nome: "Ana" }}
        showDefaultButtons={false}
      >
        <Input id="nome" name="nome" label="Nome" required />
      </Form>,
    );

    await waitFor(
      () => {
        expect(onValidationChange).toHaveBeenCalledWith(true, expect.anything());
      },
      { timeout: 2000 },
    );
  });

  /**
   * O contraponto que impede o conserto de virar "reporta true sempre": campo
   * obrigatório VAZIO no mount tem que reportar inválido.
   */
  it("campo obrigatório vazio no mount reporta inválido", async () => {
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

    await waitFor(
      () => {
        expect(onValidationChange).toHaveBeenCalledWith(
          false,
          expect.anything(),
        );
      },
      { timeout: 2000 },
    );
    expect(onValidationChange).not.toHaveBeenCalledWith(true, expect.anything());
  });

  /** Regressão: preencher depois continua virando válido. */
  it("preencher o campo vazio passa a reportar válido", async () => {
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

    await waitFor(
      () => {
        expect(onValidationChange).toHaveBeenLastCalledWith(
          true,
          expect.anything(),
        );
      },
      { timeout: 2000 },
    );
  });
});
