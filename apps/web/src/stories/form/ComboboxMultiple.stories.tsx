import type { Meta, StoryObj } from "@storybook/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { ComboboxMultiple } from "@/components/Form/Fields/ComboboxMultiple";

const skillOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "react", label: "React" },
  { value: "nextjs", label: "Next.js" },
  { value: "nodejs", label: "Node.js" },
  { value: "python", label: "Python" },
  { value: "sql", label: "SQL" },
  { value: "docker", label: "Docker" },
];

function FormDecorator({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}) {
  const methods = useForm({ defaultValues });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

const meta: Meta<typeof ComboboxMultiple> = {
  title: "Form Fields/ComboboxMultiple",
  component: ComboboxMultiple,
  tags: ["autodocs"],
  argTypes: {
    required: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <FormDecorator>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ComboboxMultiple>;

export const Default: Story = {
  args: {
    name: "skills",
    label: "Habilidades",
    options: skillOptions,
    placeholder: "Selecione habilidades",
  },
};

export const WithPreselected: Story = {
  decorators: [
    (Story) => (
      <FormDecorator defaultValues={{ skills: ["react", "typescript"] }}>
        <div className="w-[320px]">
          <Story />
        </div>
      </FormDecorator>
    ),
  ],
  args: {
    name: "skills",
    label: "Habilidades",
    options: skillOptions,
    selected: "Selecionado(s): {{n}}",
  },
};

export const WithSearch: Story = {
  args: {
    name: "skills",
    label: "Habilidades (com busca)",
    options: skillOptions,
    showSearchField: true,
    searchPlaceholder: "Pesquisar habilidade...",
    placeholder: "Selecione habilidades",
  },
};

export const WithMaxLimit: Story = {
  args: {
    name: "skills",
    label: "Até 3 habilidades",
    options: skillOptions,
    max: 3,
    placeholder: "Selecione até 3",
  },
};

export const Required: Story = {
  args: {
    name: "skills",
    label: "Habilidades (obrigatório)",
    options: skillOptions,
    required: true,
    placeholder: "Selecione ao menos uma",
  },
};

export const Disabled: Story = {
  args: {
    name: "skills",
    label: "Habilidades (desabilitado)",
    options: skillOptions,
    disabled: true,
    placeholder: "Selecione habilidades",
  },
};
