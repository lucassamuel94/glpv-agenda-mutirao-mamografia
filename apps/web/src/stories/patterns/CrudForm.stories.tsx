import type { Meta, StoryObj } from "@storybook/nextjs";
import { useState } from "react";
import { Dialog } from "@/components/Dialog";
import { Button, CancelButton } from "@/components/Button";
import { Form, Input, Select, MaskedInput } from "@/components/Form";
import { z } from "zod";

const exampleSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  company: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(8, "Telefone inválido"),
  segment: z.string().min(1, "Selecione um segmento"),
});

const segmentOptions = [
  { value: "Tecnologia", label: "Tecnologia" },
  { value: "Varejo", label: "Varejo" },
  { value: "Saúde", label: "Saúde" },
  { value: "Educação", label: "Educação" },
  { value: "Financeiro", label: "Financeiro" },
];

const CrudFormDemo = () => <div />;

const meta: Meta<typeof CrudFormDemo> = {
  title: "Patterns/CRUD Formulário",
  component: CrudFormDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
## Padrão de Formulário CRUD (Dialog + Form)

Estrutura padrão para criar/editar entidades via modal.

### Estrutura
\`\`\`
Dialog (título + footer)
  └── Form (react-hook-form + Zod)
        ├── Seção "Informações Básicas"
        │   ├── Input (nome)
        │   └── Input (empresa)
        ├── Seção "Contato"
        │   ├── Input[email]
        │   └── MaskedInput[phone]
        └── Seção "Segmentação"
            └── Select (segmento)
\`\`\`

### Convenções
- **Dialog** recebe \`title\`, \`maxWidth\`, e \`footer\` (Cancelar + Salvar)
- **Form** recebe \`schema\` (Zod), \`defaultValues\`, \`onSubmit\`, \`showDefaultButtons={false}\`
- **Seções** separadas com \`border-t border-border pt-6\`
- **Título da seção**: \`text-xs font-bold text-muted-foreground uppercase tracking-wider\`
- **Grid**: \`grid grid-cols-1 md:grid-cols-2 gap-6\` para campos lado a lado
- **Footer do Dialog** controla o submit via \`form={formId}\`

### Arquivos de referência
- \`src/modules/customers/customer-dialog.tsx\`
- \`src/modules/customers/customer-form.tsx\`
- \`src/modules/customers/customer-validation.ts\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CrudFormDemo>;

export const CreateMode: Story = {
  name: "Criar (novo registro)",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Novo</Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Novo Cliente"
          maxWidth="lg"
          footer={
            <>
              <CancelButton onClick={() => setOpen(false)} />
              <Button
                type="submit"
                form="demo-form"
                variant="primary"
                size="md"
              >
                Criar Cliente
              </Button>
            </>
          }
        >
          <Form
            id="demo-form"
            schema={exampleSchema}
            onSubmit={(data) => {
              alert(JSON.stringify(data, null, 2));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            showDefaultButtons={false}
            className="space-y-6"
          >
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Informações Básicas
              </h3>
              <Input
                name="name"
                label="Nome Completo"
                required
                placeholder="Ex: João Silva"
              />
              <Input
                name="company"
                label="Empresa"
                placeholder="Ex: Tech Solutions Ltda"
              />
            </div>

            <div className="space-y-6 border-t border-border pt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  name="email"
                  label="E-mail"
                  type="email"
                  required
                  placeholder="email@empresa.com"
                />
                <MaskedInput
                  type="phone"
                  name="phone"
                  label="Telefone"
                  required
                />
              </div>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Segmentação
              </h3>
              <Select
                name="segment"
                label="Segmento"
                required
                placeholder="Selecione o segmento"
                options={segmentOptions}
              />
            </div>
          </Form>
        </Dialog>
      </>
    );
  },
};

export const EditMode: Story = {
  name: "Editar (registro existente)",
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="secondary">
          Editar
        </Button>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Editar Cliente"
          maxWidth="lg"
          footer={
            <>
              <CancelButton onClick={() => setOpen(false)} />
              <Button
                type="submit"
                form="edit-form"
                variant="primary"
                size="md"
              >
                Salvar
              </Button>
            </>
          }
        >
          <Form
            id="edit-form"
            schema={exampleSchema}
            defaultValues={{
              name: "João Silva",
              company: "Tech Solutions",
              email: "joao@tech.com",
              phone: "(11) 99999-8888",
              segment: "Tecnologia",
            }}
            onSubmit={(data) => {
              alert(JSON.stringify(data, null, 2));
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
            showDefaultButtons={false}
            className="space-y-6"
          >
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Informações Básicas
              </h3>
              <Input
                name="name"
                label="Nome Completo"
                required
                placeholder="Ex: João Silva"
              />
              <Input
                name="company"
                label="Empresa"
                placeholder="Ex: Tech Solutions Ltda"
              />
            </div>

            <div className="space-y-6 border-t border-border pt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  name="email"
                  label="E-mail"
                  type="email"
                  required
                  placeholder="email@empresa.com"
                />
                <MaskedInput
                  type="phone"
                  name="phone"
                  label="Telefone"
                  required
                />
              </div>
            </div>

            <div className="space-y-6 border-t border-border pt-6">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Segmentação
              </h3>
              <Select
                name="segment"
                label="Segmento"
                required
                placeholder="Selecione o segmento"
                options={segmentOptions}
              />
            </div>
          </Form>
        </Dialog>
      </>
    );
  },
};
