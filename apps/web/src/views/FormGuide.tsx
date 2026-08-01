/**
 * Form Guide Page
 *
 * Página de referência e demonstração de todos os componentes de formulário
 * catalogados em `@/components/Form` (Input, Textarea, Select, Checkbox,
 * Switch, RadioGroup, NumberInput, DatePicker, TimePicker, Combobox,
 * MultiSelect, MaskedInput, Days, TimeZone).
 *
 * Premissas (ver docs/COMPONENT_GUIDELINES.md):
 * - **Sempre** envolver os campos em `<Form schema={zodSchema} onSubmit={...}>`
 *   — os campos consomem o contexto de React Hook Form via Zod.
 * - **Não** importar `@/components/ui/input`, `ui/checkbox`, `ui/select`,
 *   `ui/textarea`, etc. quando o campo for de formulário — use os equivalentes
 *   catalogados em `@/components/Form`.
 * - Campos standalone (sem `<Form>`) só são aceitáveis em casos muito
 *   específicos (filtros em URL, busca inline) — ainda assim, prefira o
 *   campo catalogado para manter consistência visual.
 *
 * @module views/FormGuide
 */

"use client";

import React, { useState, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Form } from "@/components/Form";
import {
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  RadioGroup,
  NumberInput,
  DatePicker,
  TimePicker,
  Combobox,
  MultiSelect,
  MaskedInput,
  Days,
  TimeZone,
} from "@/components/Form";
import { z } from "zod";
import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

// Schema de validação completo para testar todos os campos
const exampleSchema = z.object({
  // Input fields
  textInput: z.string().min(3, "Mínimo 3 caracteres"),
  emailInput: z.string().email("E-mail inválido"),
  passwordInput: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),

  // TextArea
  textArea: z.string().min(10, "Mínimo 10 caracteres"),

  // Select e Combobox
  select: z.string().min(1, "Selecione uma opção"),
  combobox: z.string().min(1, "Selecione uma cidade"),

  // Number
  numberInput: z.string().regex(/^\d+$/, "Apenas números"),

  // Date e Time
  datePicker: z.string().min(1, "Selecione uma data"),
  datePickerEditable: z.string().optional(), // modo editable: opcional/limpável
  timePicker: z.string().min(1, "Selecione um horário"),

  // Boolean fields
  checkbox: z
    .boolean()
    .refine((val) => val === true, "Você deve aceitar os termos"),
  switch: z.boolean(),

  // Radio
  radio: z.string().min(1, "Selecione uma opção"),

  // Multiple
  comboboxMultiple: z.array(z.string()).min(1, "Selecione ao menos uma tag"),
  days: z.array(z.string()).min(1, "Selecione ao menos um dia"),

  // Masked
  phone: z.string().min(14, "Telefone incompleto"),
  cpf: z.string().min(14, "CPF incompleto"),
  cnpj: z.string().optional(),
  zipcode: z.string().optional(),

  // TimeZone
  timeZone: z.string().optional(),
});

const FormGuide = () => {
  // const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Estado local
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers - memoized
  const handleSubmit = useCallback((data: z.infer<typeof exampleSchema>) => {
    // setFormData(data);
    console.log("Submit form guide: ", data);

    try {
      setIsSubmitting(true);
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 5000);
    }
  }, []);

  return (
    <>
      <PageHeader title="Design System / Form Guide" />
      <div className="w-full space-y-12 pb-20">
        {/* Introdução */}

        {/* Formulário Completo com Todos os Campos */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <FileText size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Formulário Completo - Teste de Validação
            </h2>
          </div>
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-foreground">
                Todos os campos com validação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form
                schema={exampleSchema}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
                className="space-y-6"
              >
                {/* Inputs de Texto */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Campos de Texto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      name="textInput"
                      label="Nome"
                      required
                      placeholder="Digite seu nome (mín. 3 caracteres)"
                    />
                    <Input
                      name="emailInput"
                      label="E-mail"
                      type="email"
                      required
                      placeholder="email@exemplo.com"
                    />
                    <Input
                      name="passwordInput"
                      label="Senha"
                      type="password"
                      required
                      placeholder="Digite sua senha"
                      helpTip="8+ caracteres, com maiúscula, minúscula e número"
                    />
                    <NumberInput
                      name="numberInput"
                      label="Idade"
                      required
                      placeholder="Digite apenas números"
                    />
                  </div>
                </div>

                {/* TextArea */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Área de Texto
                  </h3>
                  <Textarea
                    name="textArea"
                    label="Descrição"
                    required
                    placeholder="Digite uma descrição (mín. 10 caracteres)"
                    rows={4}
                    helpTip="Mínimo 10 caracteres"
                  />
                </div>

                {/* Selects e Combobox */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Seleção
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      name="select"
                      label="Categoria"
                      required
                      options={[
                        { value: "tech", label: "Tecnologia" },
                        { value: "retail", label: "Varejo" },
                        { value: "industry", label: "Indústria" },
                      ]}
                    />
                    <Combobox
                      name="combobox"
                      label="Cidade"
                      required
                      placeholder="Busque uma cidade"
                      options={[
                        { value: "sp", label: "São Paulo" },
                        { value: "rj", label: "Rio de Janeiro" },
                        { value: "mg", label: "Belo Horizonte" },
                        { value: "ba", label: "Salvador" },
                        { value: "pr", label: "Curitiba" },
                      ]}
                    />
                  </div>
                </div>

                {/* Date e Time */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Data e Hora
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DatePicker
                      name="datePicker"
                      label="Data de Nascimento"
                      required
                    />
                    <TimePicker
                      name="timePicker"
                      label="Horário"
                      required
                      placeholder="Selecione o horário"
                    />
                    {/* Modo editable: input mascarado dd/mm/aaaa que guarda
                        YYYY-MM-DD. Clicar no campo OU no ícone abre o calendário;
                        deixar vazio limpa. Use para datas opcionais/limpáveis. */}
                    <DatePicker
                      name="datePickerEditable"
                      label="Data opcional (editável)"
                      editable
                      infoText="Modo editable: digite dd/mm/aaaa ou clique no campo para abrir o calendário. Deixe vazio para limpar."
                    />
                  </div>
                </div>

                {/* Boolean Fields */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Campos Booleanos
                  </h3>
                  <div className="space-y-3">
                    <Checkbox
                      name="checkbox"
                      label="Aceito os termos e condições"
                      required
                    />
                    <Switch
                      name="switch"
                      label="Receber notificações"
                      required
                    />
                  </div>
                </div>

                {/* Radio Group */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Radio Group
                  </h3>
                  <RadioGroup
                    name="radio"
                    label="Tipo de Conta"
                    required
                    options={[
                      { value: "personal", label: "Pessoal" },
                      { value: "business", label: "Empresarial" },
                      { value: "enterprise", label: "Enterprise" },
                    ]}
                  />
                </div>

                {/* Multiple Selection */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Seleção Múltipla
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MultiSelect
                      name="comboboxMultiple"
                      label="Tags"
                      required
                      placeholder="Selecione tags..."
                      searchPlaceholder="Pesquisar tags..."
                      emptyText="Nenhuma tag encontrada."
                      options={[
                        { value: "urgent", label: "Urgente" },
                        { value: "important", label: "Importante" },
                        { value: "follow-up", label: "Follow-up" },
                        { value: "review", label: "Revisão" },
                      ]}
                      max={3}
                    />
                    <Days name="days" label="Dias da Semana" required max={5} />
                  </div>
                </div>

                {/* Masked Inputs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Campos com Máscara
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MaskedInput
                      type="phone"
                      name="phone"
                      label="Telefone"
                      required
                    />
                    <MaskedInput type="cpf" name="cpf" label="CPF" required />
                    <MaskedInput
                      type="cnpj"
                      name="cnpj"
                      label="CNPJ"
                      required
                    />
                    <MaskedInput
                      type="zipcode"
                      name="zipcode"
                      label="CEP"
                      required
                    />
                  </div>
                </div>

                {/* TimeZone */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                    Outros
                  </h3>
                  <TimeZone name="timeZone" label="Fuso Horário" required />
                </div>
              </Form>
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
};

export default FormGuide;
