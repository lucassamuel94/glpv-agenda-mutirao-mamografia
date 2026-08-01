/**
 * Style Guide Page
 *
 * Catálogo vivo de todos os componentes catalogados em `@/components/*` e
 * primitivos `@/components/ui/*` (shadcn). Serve como referência visual e
 * técnica para o time — toda nova feature deve consumir os componentes aqui
 * documentados.
 *
 * Premissas (ver docs/COMPONENT_GUIDELINES.md):
 * - Sempre preferir o componente catalogado em `@/components/*` (Button, Card,
 *   Tooltip, Dialog, DataTable, Pagination, Badge, etc.).
 * - `@/components/ui/*` só deve ser usado quando não houver equivalente
 *   catalogado (ex.: accordion, popover, scroll-area, separator).
 * - Este arquivo importa ambos PROPOSITALMENTE: a função dele é catalogar e
 *   demonstrar o uso correto de cada um. Em views/módulos normais, **não**
 *   importe diretamente de `@/components/ui/*`.
 *
 * @module views/StyleGuide
 */

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "@/lib/toast";
import Loading from "@/components/Loading";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  Bell,
  User,
  Check,
  Trash2,
  Edit,
  Eye,
  ChevronDown,
  Palette,
  Type,
  MousePointer,
  Layout as LayoutIcon,
  AlertTriangle,
  X,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Table as TableIcon,
  Package,
  Inbox,
  Loader2,
  ChevronsLeft,
  Tag,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Info,
  Filter,
  Mail,
  Calendar,
  Settings,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Receipt,
  BarChart2,
  Send,
  Copy,
  MoreHorizontal,
  Sparkles,
  Save,
  Sun,
  Moon,
  Flame,
} from "lucide-react";
import SearchableSelect from "@/components/SearchableSelect";
import Pagination from "@/components/Pagination";
import SlideOver from "@/components/SlideOver";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/providers/ThemeProvider";
import {
  Input,
  TextArea,
  Checkbox,
  Switch,
  Select,
  RadioGroup,
  NumberInput,
  DatePicker,
} from "@/components/Form";
import { Badge } from "@/components/Badge";

// ────────────────────────────────────────────────────────────────────────────
// Componentes catalogados + primitivos shadcn re-exportados — todos pelo
// barrel `@/components`. Em views/módulos sempre use este path único.
// Ver docs/COMPONENT_GUIDELINES.md.
// ────────────────────────────────────────────────────────────────────────────
import {
  Tooltip,
  Dialog,
  Confirm,
  ConfirmWithAwareness,
  DataTable,
  Tabs,
  Dropdown,
  RowActionsMenu,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Separator,
  Skeleton,
  type DropdownItem,
} from "@/components";
import { APP_NAME } from "@/environments";
const StyleGuide = () => {
  const [selectValue, setSelectValue] = useState("");
  const [paginationPage, setPaginationPage] = useState(1);
  const [activeTab, setActiveTab] = useState("tab1");
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagValue, setTagValue] = useState("");

  // Estados para homologar Input no modo standalone
  const [standaloneInput, setStandaloneInput] = useState("");
  const [standaloneInputWithIcon, setStandaloneInputWithIcon] = useState("");
  const [standaloneInputError, setStandaloneInputError] = useState("abc");
  // Estado para o exemplo de Confirm (substitui o antigo AlertDialog cru)
  const [confirmExampleOpen, setConfirmExampleOpen] = useState(false);
  // Estado para o exemplo de ConfirmWithAwareness (awareness gate)
  const [awarenessExampleOpen, setAwarenessExampleOpen] = useState(false);

  // Estados adicionais para outros inputs do StyleGuide
  const [modalNome, setModalNome] = useState("");
  const [modalEmpresa, setModalEmpresa] = useState("");
  const [filterNome, setFilterNome] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  // Estados para TextArea
  const [standaloneTextArea, setStandaloneTextArea] = useState("");
  const [standaloneTextAreaError, setStandaloneTextAreaError] = useState("ab");

  // Estados para Checkbox
  const [standaloneCheckbox, setStandaloneCheckbox] = useState(false);
  const [standaloneCheckboxRequired, setStandaloneCheckboxRequired] =
    useState(false);

  // Estados para Switch
  const [standaloneSwitch, setStandaloneSwitch] = useState(false);
  const [standaloneSwitchRequired, setStandaloneSwitchRequired] =
    useState(false);

  // Estados para Select
  const [standaloneSelect, setStandaloneSelect] = useState("");
  const [standaloneSelectRequired, setStandaloneSelectRequired] = useState("");

  // Estados para RadioGroup
  const [standaloneRadio, setStandaloneRadio] = useState("");
  const [standaloneRadioRequired, setStandaloneRadioRequired] = useState("");

  // Estados para NumberInput
  const [standaloneNumber, setStandaloneNumber] = useState("");
  const [standaloneNumberRange, setStandaloneNumberRange] = useState("");

  // Estados para DatePicker
  const [standaloneDate, setStandaloneDate] = useState<string | undefined>();
  const [standaloneDateRequired, setStandaloneDateRequired] = useState<
    string | undefined
  >();

  return (
    <>
      <PageHeader title="Design System / Style Guide" />
      {/* Theme Selector — usa Dropdown com type:"radio" (seleção exclusiva) */}
      <div className="flex justify-end mb-6">
        <Dropdown
          contentClassName="w-40"
          trigger={
            <Button
              variant="secondary"
              size="md"
              className="flex items-center gap-2"
            >
              {theme === "light" ? (
                <Sun size={18} />
              ) : theme === "dark" ? (
                <Moon size={18} />
              ) : (
                <Sparkles size={18} />
              )}
              <span className="capitalize">{theme}</span>
              <ChevronDown size={16} />
            </Button>
          }
          items={[
            { type: "label", label: "Tema" },
            { type: "separator" },
            {
              type: "radio",
              value: theme,
              onValueChange: (v) => setTheme(v as "light" | "dark"),
              options: [
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
              ],
            },
          ]}
        />
      </div>

      <div className="w-full space-y-12 pb-20">
        {/* 1. Typography */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Type size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Tipografia</h2>
          </div>
          <Card variant="default" className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                  Page Title (22px)
                </p>
                <h1 className="text-[22px] font-semibold leading-7 tracking-[-0.02em] text-foreground">
                  Título da Página
                </h1>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                  Section Title (H2/LG)
                </p>
                <h2 className="text-xl font-bold text-foreground">
                  Subtítulo da Seção
                </h2>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                  Card Title (H3/MD)
                </p>
                <h3 className="text-lg font-bold text-foreground">
                  Título do Cartão
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                  Body Text
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                  O {APP_NAME} utiliza a fonte <strong>Inter</strong> para
                  garantir legibilidade em interfaces densas. Este é um exemplo
                  de parágrafo padrão com altura de linha otimizada para
                  leitura.
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                  Small / Meta Text
                </p>
                <p className="text-sm text-muted-foreground">
                  Utilizado para legendas, datas e metadados secundários.
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                  Tiny / Badge Text
                </p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Rótulo ou Badge
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. Colors */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Palette size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Paleta de Cores
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="h-20 w-full bg-primary rounded-lg mb-3 shadow-sm"></div>
              <p className="font-bold text-card-foreground">Primary</p>
              <p className="text-xs text-muted-foreground">Roxo Vibrante</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="h-20 w-full bg-emerald-500 dark:bg-emerald-600 rounded-lg mb-3 shadow-sm"></div>
              <p className="font-bold text-card-foreground">Success</p>
              <p className="text-xs text-muted-foreground">Emerald-500</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="h-20 w-full bg-destructive rounded-lg mb-3 shadow-sm"></div>
              <p className="font-bold text-card-foreground">Danger</p>
              <p className="text-xs text-muted-foreground">Red-500</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border">
              <div className="h-20 w-full bg-foreground rounded-lg mb-3 shadow-sm"></div>
              <p className="font-bold text-card-foreground">Neutral</p>
              <p className="text-xs text-muted-foreground">Foreground</p>
            </div>
          </div>
        </section>

        {/* 3. Shell & Navigation */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <LayoutIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Shell e Navegação
            </h2>
          </div>
          <Card variant="default" className="space-y-6">
            <div className="overflow-x-auto">
              <div className="min-w-[560px] rounded-lg bg-[hsl(var(--shell-bg))] p-2">
                <div className="flex gap-2">
                  <aside className="w-[236px] shrink-0 rounded-lg bg-[hsl(var(--sidebar-bg))] p-2 text-[hsl(var(--sidebar-text-muted))]">
                    <div className="flex h-12 items-center px-2 text-[13px] font-semibold text-[hsl(var(--sidebar-text))]">
                      Sidebar 236px
                    </div>
                    <div className="space-y-1 py-3">
                      <div className="flex h-8 items-center gap-2 rounded-md bg-[hsl(var(--sidebar-active))] px-2 text-[13px] font-medium text-[hsl(var(--sidebar-text))]">
                        <LayoutDashboard size={16} />
                        Item selecionado
                      </div>
                      <div className="flex h-8 items-center gap-2 rounded-md px-2 text-[13px]">
                        <Users size={16} />
                        Item de navegação
                      </div>
                    </div>
                  </aside>
                  <div className="app-shell-frame min-h-52 flex-1 overflow-hidden rounded-xl border">
                    <header className="flex h-12 items-center border-b bg-[hsl(var(--shell-surface))] px-4 text-[13px] font-medium">
                      Topbar 48px
                    </header>
                    <div className="p-4 text-sm text-muted-foreground">
                      Conteúdo dentro da moldura contínua.
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <strong className="text-foreground">Shell desktop:</strong>{" "}
                sidebar 236px, recolhida 64px, gap externo 8px, topbar 48px.
              </li>
              <li>
                <strong className="text-foreground">Navegação:</strong> item
                32px, ícone 16px, texto 13px.
              </li>
              <li>
                <strong className="text-foreground">Seleção:</strong> fundo
                neutro; indigo somente para ação e foco.
              </li>
              <li>
                <strong className="text-foreground">Mobile:</strong> drawer
                abaixo de 768px, sem moldura ornamental.
              </li>
            </ul>
          </Card>
        </section>

        {/* 4. Buttons & Actions */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <MousePointer size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Botões e Ações
            </h2>
          </div>
          <Card variant="default">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-foreground">
                Botões Principais
              </h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary" size="lg">
                  Primary Action
                </Button>
                <Button variant="secondary" size="lg">
                  Secondary
                </Button>
                <Button variant="ghost" size="lg">
                  Ghost Button
                </Button>
                <Button variant="destructive" size="lg">
                  <Trash2 size={16} /> Destructive
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mt-3 mb-3">
                Icon Buttons
              </p>
              <div className="flex gap-4">
                <Button variant="secondary" size="icon">
                  <Edit size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-accent hover:bg-muted"
                >
                  <Bell size={18} />
                </Button>
              </div>
            </div>

            {/* Exemplos de aplicação: botão + badge + tags */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Exemplos de aplicação (botão, botão + ícone, badge, tags)
              </p>
              <div className="space-y-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Botão só texto
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="md">
                      Salvar
                    </Button>
                    <Button variant="secondary" size="md">
                      Cancelar
                    </Button>
                    <Button variant="ghost" size="md">
                      Voltar
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Botão com texto e ícone
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="md">
                      <Plus size={16} className="mr-2" />
                      Novo Cliente
                    </Button>
                    <Button variant="secondary" size="md">
                      <Edit size={16} className="mr-2" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="md">
                      <Send size={16} className="mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Botão com badge (quantidade, New, Hot)
                  </p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative inline-flex">
                      <Button variant="secondary" size="md" className="gap-2">
                        <Bell size={16} />
                        Notificações
                        <Badge position="top-right" outline type="quantity">
                          3
                        </Badge>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 4. Forms */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <LayoutIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Formulários</h2>
          </div>
          <Card
            variant="default"
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div>
              {/* HOMOLOGAÇÃO: Input Padrão (Standalone) */}
              <Input
                name="standalone-input"
                label="Input Padrão"
                type="text"
                placeholder="Digite algo..."
                value={standaloneInput}
                onChange={(e) => setStandaloneInput(e.target.value)}
              />
            </div>
            <div className="relative">
              {/* HOMOLOGAÇÃO: Input com Ícone (Standalone) */}
              <Input
                name="standalone-input-icon"
                label="Input com Ícone"
                type="text"
                placeholder="Buscar..."
                value={standaloneInputWithIcon}
                onChange={(e) => setStandaloneInputWithIcon(e.target.value)}
                className="pl-10"
              />
              <Search
                size={18}
                className="absolute left-3 bottom-[0.625rem] text-muted-foreground pointer-events-none z-10"
              />
            </div>
            <div>
              <Select
                name="example-select"
                label="Select (Padronizado)"
                options={[
                  { value: "1", label: "Opção 1" },
                  { value: "2", label: "Opção 2" },
                ]}
                placeholder="Selecione uma opção"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">
                Searchable Select (Custom)
              </label>
              <SearchableSelect
                options={[
                  { label: "Opção A", value: "a" },
                  { label: "Opção B", value: "b" },
                ]}
                value={selectValue}
                onChange={setSelectValue}
                placeholder="Selecione..."
              />
            </div>
            <div className="col-span-2">
              {/* HOMOLOGAÇÃO: Input com Validação e Erro (Standalone) */}
              <Input
                name="standalone-input-error"
                label="Estado de Erro"
                type="text"
                required
                value={standaloneInputError}
                onChange={(e) => setStandaloneInputError(e.target.value)}
                validation={{ minLength: 5 }}
                helpTip="Mínimo 5 caracteres"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: TextArea Padrão (Standalone) */}
              <TextArea
                name="standalone-textarea"
                label="TextArea Padrão"
                placeholder="Digite uma descrição..."
                value={standaloneTextArea}
                onChange={(e) => setStandaloneTextArea(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: TextArea com Validação (Standalone) */}
              <TextArea
                name="standalone-textarea-error"
                label="TextArea com Erro"
                placeholder="Digite no mínimo 10 caracteres..."
                required
                value={standaloneTextAreaError}
                onChange={(e) => setStandaloneTextAreaError(e.target.value)}
                validation={{ minLength: 10 }}
                helpTip="Mínimo 10 caracteres"
                rows={4}
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: Checkbox Padrão (Standalone) */}
              <Checkbox
                name="standalone-checkbox"
                label="Checkbox Padrão"
                checked={standaloneCheckbox}
                onCheckedChange={(checked) => setStandaloneCheckbox(checked)}
                helpTip="Marque para ativar"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: Checkbox Obrigatório (Standalone) */}
              <Checkbox
                name="standalone-checkbox-required"
                label="Aceito os termos e condições"
                required
                checked={standaloneCheckboxRequired}
                onCheckedChange={(checked) =>
                  setStandaloneCheckboxRequired(checked)
                }
                helpTip="Este campo é obrigatório"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: Switch Padrão (Standalone) */}
              <Switch
                name="standalone-switch"
                label="Switch Padrão"
                checked={standaloneSwitch}
                onCheckedChange={setStandaloneSwitch}
                helpTip="Ativar/Desativar"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: Switch Obrigatório (Standalone) */}
              <Switch
                name="standalone-switch-required"
                label="Receber notificações"
                required
                checked={standaloneSwitchRequired}
                onCheckedChange={setStandaloneSwitchRequired}
                helpTip="Este campo é obrigatório"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: Select Padrão (Standalone) */}
              <Select
                name="standalone-select"
                label="Select Padrão"
                value={standaloneSelect}
                onValueChange={setStandaloneSelect}
                options={[
                  { value: "opcao1", label: "Opção 1" },
                  { value: "opcao2", label: "Opção 2" },
                  { value: "opcao3", label: "Opção 3" },
                ]}
                placeholder="Selecione uma opção..."
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: Select Obrigatório (Standalone) */}
              <Select
                name="standalone-select-required"
                label="Categoria"
                required
                value={standaloneSelectRequired}
                onValueChange={setStandaloneSelectRequired}
                options={[
                  { value: "tech", label: "Tecnologia" },
                  { value: "retail", label: "Varejo" },
                  { value: "service", label: "Serviços" },
                ]}
                placeholder="Selecione uma categoria..."
                helpTip="Este campo é obrigatório"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: RadioGroup Padrão (Standalone) */}
              <RadioGroup
                name="standalone-radio"
                label="RadioGroup Padrão"
                value={standaloneRadio}
                onValueChange={setStandaloneRadio}
                options={[
                  { value: "opcao1", label: "Opção 1" },
                  { value: "opcao2", label: "Opção 2" },
                  { value: "opcao3", label: "Opção 3" },
                ]}
                orientation="vertical"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: RadioGroup Obrigatório (Standalone) */}
              <RadioGroup
                name="standalone-radio-required"
                label="Tipo de Contato"
                required
                value={standaloneRadioRequired}
                onValueChange={setStandaloneRadioRequired}
                options={[
                  { value: "email", label: "E-mail" },
                  { value: "phone", label: "Telefone" },
                  { value: "whatsapp", label: "WhatsApp" },
                ]}
                orientation="horizontal"
                helpTip="Este campo é obrigatório"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: NumberInput Padrão (Standalone) */}
              <NumberInput
                name="standalone-number"
                label="Número Padrão"
                placeholder="Digite um número..."
                value={standaloneNumber}
                onChange={(e) => setStandaloneNumber(e.target.value)}
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: NumberInput com Range (Standalone) */}
              <NumberInput
                name="standalone-number-range"
                label="Idade (18-100)"
                required
                placeholder="Digite sua idade..."
                value={standaloneNumberRange}
                onChange={(e) => setStandaloneNumberRange(e.target.value)}
                validation={{ min: 18, max: 100 }}
                helpTip="Idade entre 18 e 100 anos"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: DatePicker Padrão (Standalone) */}
              <DatePicker
                name="standalone-date"
                label="Data Padrão"
                placeholder="Selecione uma data..."
                value={standaloneDate}
                onValueChange={setStandaloneDate}
                variant="literal"
              />
            </div>
            <div>
              {/* HOMOLOGAÇÃO: DatePicker Obrigatório (Standalone) */}
              <DatePicker
                name="standalone-date-required"
                label="Data de Nascimento"
                required
                placeholder="Selecione sua data de nascimento..."
                value={standaloneDateRequired}
                onValueChange={setStandaloneDateRequired}
                variant="numeric"
                helpTip="Este campo é obrigatório"
              />
            </div>
          </Card>
        </section>

        {/* 5. Feedback / Toasts */}
        <section className="space-y-6">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <AlertTriangle size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Feedback & Notificações
            </h2>
          </div>
          <Card variant="default">
            <p className="text-sm text-muted-foreground mb-4">
              Clique para testar os novos estilos de Toast.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() =>
                  toast("Operação realizada com sucesso!", "success")
                }
                variant="primary"
                size="md"
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
              >
                Toast Sucesso
              </Button>
              <Button
                onClick={() =>
                  toast("Algo deu errado. Tente novamente.", "error")
                }
                variant="primary"
                size="md"
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white"
              >
                Toast Erro
              </Button>
              <Button
                onClick={() =>
                  toast("Atenção: Sua licença expira em 3 dias.", "warning")
                }
                variant="primary"
                size="md"
                className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-600 text-white"
              >
                Toast Alerta
              </Button>
              <Button
                onClick={() => toast("Nova atualização disponível.", "info")}
                variant="primary"
                size="md"
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                Toast Info
              </Button>
            </div>
          </Card>
        </section>

        {/* 4. Cards & Stat Cards */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <LayoutIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Cards e Estatísticas
            </h2>
          </div>
          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Stat Card (Dashboard)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card
                  variant="default"
                  icon={<DollarSign size={28} strokeWidth={1.5} />}
                  className="flex flex-col justify-between hover:border-primary transition-colors"
                >
                  <div className="flex justify-end mb-4">
                    <span className="text-sm font-medium px-3 py-1 rounded-full flex items-center border bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800">
                      <TrendingUp size={14} className="mr-1" /> +12.5%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold text-foreground tracking-tight mb-2">
                      R$ 450K
                    </h3>
                    <p className="text-base text-muted-foreground font-medium">
                      Pipeline Total
                    </p>
                  </div>
                </Card>
                <Card
                  variant="default"
                  icon={<Users size={28} strokeWidth={1.5} />}
                  className="flex flex-col justify-between hover:border-primary transition-colors"
                >
                  <div className="flex justify-end mb-4">
                    <span className="text-sm font-medium px-3 py-1 rounded-full flex items-center border bg-secondary text-muted-foreground border-border">
                      Total
                    </span>
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold text-foreground tracking-tight mb-2">
                      1,234
                    </h3>
                    <p className="text-base text-muted-foreground font-medium">
                      Leads Ativos
                    </p>
                  </div>
                </Card>
                <Card
                  variant="default"
                  icon={<FileText size={28} strokeWidth={1.5} />}
                  className="flex flex-col justify-between hover:border-primary transition-colors"
                >
                  <div className="flex justify-end mb-4">
                    <span className="text-sm font-medium px-3 py-1 rounded-full flex items-center border bg-red-50 text-red-700 border-red-100">
                      <TrendingUp size={14} className="mr-1" /> -5.2%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-4xl font-bold text-foreground tracking-tight mb-2">
                      89
                    </h3>
                    <p className="text-base text-muted-foreground font-medium">
                      Faturas Pendentes
                    </p>
                  </div>
                </Card>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Cards Variações
              </p>
              <Card>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Padrão
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este é um exemplo de card padrão usado em toda a aplicação.
                  Utiliza padding de{" "}
                  <code className="bg-accent px-1 rounded">p-6</code> e borda{" "}
                  <code className="bg-accent px-1 rounded">border-border</code>.
                </p>
              </Card>
              <Card className="mt-4 border-primary">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Active
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este é um exemplo de card padrão usado em toda a aplicação.
                  Utiliza padding de{" "}
                  <code className="bg-accent px-1 rounded">p-6</code> e borda{" "}
                  <code className="bg-accent px-1 rounded">border-border</code>.
                </p>
              </Card>
              <Card className="mt-4 border-primary bg-primary/10">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Active Background
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este é um exemplo de card padrão usado em toda a aplicação.
                  Utiliza padding de{" "}
                  <code className="bg-accent px-1 rounded">p-6</code> e borda{" "}
                  <code className="bg-accent px-1 rounded">border-border</code>.
                </p>
              </Card>

              <Card className="mt-4 border-border hover:bg-primary/10 hover:border-primary">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Hover
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este é um exemplo de card padrão usado em toda a aplicação.
                  Utiliza padding de{" "}
                  <code className="bg-accent px-1 rounded">p-6</code> e borda{" "}
                  <code className="bg-accent px-1 rounded">border-border</code>.
                </p>
              </Card>

              <Card className="mt-4 bg-muted border-transparent ">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Muted
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este é um exemplo de card padrão usado em toda a aplicação.
                  Utiliza padding de{" "}
                  <code className="bg-accent px-1 rounded">p-6</code> e borda{" "}
                  <code className="bg-accent px-1 rounded">border-border</code>.
                </p>
              </Card>
              <Card className="mt-4 bg-muted border-border ">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Muted Border
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este é um exemplo de card padrão usado em toda a aplicação.
                  Utiliza padding de{" "}
                  <code className="bg-accent px-1 rounded">p-6</code> e borda{" "}
                  <code className="bg-accent px-1 rounded">border-border</code>.
                </p>
              </Card>
            </div>
          </Card>

          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Cards com Linha Colorida (Line First)
              </p>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Cards com borda colorida no topo seguindo o estilo &quot;line
                first&quot; para destacar diferentes tipos de conteúdo ou
                status.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card Padrão */}
                <Card
                  variant="default"
                  title="Card Padrão"
                  description="Este é um exemplo de card padrão usado em toda a aplicação. Utiliza padding de p-6 e borda border-border."
                  action={{ label: "Ação", onClick: () => {} }}
                />

                {/* Card Success */}
                <Card
                  variant="success"
                  icon={<CheckCircle2 size={16} />}
                  title="Card Success"
                  description="Card com borda fina verde (success) e background translúcido. Use para indicar sucesso, conclusão ou status positivo."
                  action={{ label: "Ação", onClick: () => {} }}
                />

                {/* Card Warning */}
                <Card
                  variant="warning"
                  icon={<AlertTriangle size={16} />}
                  title="Card Warning"
                  description="Card com borda fina amarela (warning) e background translúcido. Ideal para alertas, avisos ou informações que requerem atenção."
                  action={{ label: "Ação", onClick: () => {} }}
                />

                {/* Card Danger */}
                <Card
                  variant="danger"
                  icon={<AlertCircle size={16} />}
                  title="Card Danger"
                  description="Card com borda fina vermelha (danger) e background translúcido. Use para erros, ações destrutivas ou alertas críticos."
                  action={{ label: "Ação", onClick: () => {} }}
                />

                {/* Card Info */}
                <Card
                  variant="info"
                  icon={<Info size={16} />}
                  title="Card Info"
                  description="Card com borda fina azul claro (info) e background translúcido. Perfeito para informações gerais, dicas ou conteúdo informativo."
                  action={{ label: "Ação", onClick: () => {} }}
                />

                {/* Card Purple */}
                <Card
                  variant="purple"
                  icon={<Sparkles size={16} />}
                  title="Card Purple"
                  description="Card com borda fina roxa e background translúcido. Use para destacar conteúdo especial, premium ou VIP."
                  action={{ label: "Ação", onClick: () => {} }}
                />
              </div>

              {/* Especificações */}
              <div className="mt-6 bg-secondary p-4 rounded-lg border border-border">
                <p className="font-bold text-foreground mb-3 text-sm">
                  Especificações Técnicas
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-2">
                      <strong className="text-foreground">Classes:</strong>
                    </p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>
                        • <code className="bg-card px-1 rounded">border</code> -
                        Borda padrão de 1px
                      </li>
                      <li>
                        •{" "}
                        <code className="bg-card px-1 rounded">
                          border-primary
                        </code>{" "}
                        - Cor da borda (primary, emerald-500, etc.)
                      </li>
                      <li>
                        •{" "}
                        <code className="bg-card px-1 rounded">rounded-xl</code>{" "}
                        - Bordas arredondadas padrão
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 5. Badges & Status */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Tag size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Badges e Status
            </h2>
          </div>
          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Status Badges
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                  <CheckCircle2 size={12} className="mr-1" /> Ativo
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  <Info size={12} className="mr-1" /> Pendente
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                  <Clock size={12} className="mr-1" /> Em Andamento
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                  <AlertCircle size={12} className="mr-1" /> Cancelado
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary text-muted-foreground border border-border">
                  Rascunho
                </span>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border text-muted-foreground">
                  <Tag size={10} className="mr-1" /> VIP
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border text-muted-foreground">
                  <Tag size={10} className="mr-1" /> Novo
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 border border-primary">
                  <Tag size={10} className="mr-1" /> Hot Lead
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Segmentos
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                  Tecnologia
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                  Varejo
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                  Indústria
                </span>
              </div>
            </div>

            {/* Exemplos de aplicação */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Exemplos de aplicação
              </p>

              <div className="space-y-6">
                {/* Indicando quantidade */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Indicando quantidade
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge variant="secondary">3</Badge>
                    <Badge variant="secondary">12</Badge>
                    <Badge variant="secondary">99+</Badge>
                    <Badge variant="default">5 mensagens</Badge>
                    <Badge variant="primary" outline>
                      7 pendentes
                    </Badge>
                    <Badge variant="destructive" outline>
                      Alerta
                    </Badge>
                    <Badge variant="secondary" outline>
                      Secundário
                    </Badge>
                  </div>
                </div>

                {/* New — com e sem ícone */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    New (com e sem ícone)
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/30"
                    >
                      <Sparkles size={12} className="mr-1" />
                      New
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary border-primary/30"
                    >
                      New
                    </Badge>
                    <Badge variant="default" className="gap-1">
                      <Sparkles size={12} />
                      Novo
                    </Badge>
                    <Badge variant="default">Novo</Badge>
                  </div>
                </div>

                {/* Hot — com e sem ícone */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Hot (com e sem ícone)
                  </p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600"
                    >
                      <Flame size={12} className="mr-1" />
                      Hot
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600"
                    >
                      Hot
                    </Badge>
                    <Badge className="bg-amber-500 text-white border-amber-600 gap-1 hover:bg-amber-600">
                      <Flame size={12} />
                      Hot Lead
                    </Badge>
                    <Badge className="bg-amber-500 text-white border-amber-600 hover:bg-amber-600">
                      Hot Lead
                    </Badge>
                  </div>
                </div>
                {/* Tag */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tag</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge type="tag">VIP</Badge>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 6. Tables */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <TableIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Tabelas</h2>
          </div>
          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-1">
                Tabela Padrão
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Componente catalogado: <code>DataTable</code> de{" "}
                <code>@/components/DataTable</code>. API compound:{" "}
                <code>
                  DataTable.Root / Header / HeaderRow / HeaderCell / Body / Row
                  / Cell
                </code>
                . Use <code>DataTable.SelectAllHeaderCell</code> e{" "}
                <code>DataTable.SelectCell</code> para seleção em massa e{" "}
                <code>DataTable.SkeletonRow</code> para loading state.
              </p>
              {/* Container com estilos do StyleGuide: overflow-x-auto rounded-lg border border-border */}
              <div className="overflow-x-auto rounded-lg border border-border">
                {/* DataTable.Root: wrapper compound. Equivale ao <Table> shadcn cru. */}
                <DataTable.Root className="min-w-full divide-y divide-border">
                  {/* Header com estilos do StyleGuide: bg-secondary */}
                  <DataTable.Header className="bg-secondary">
                    <DataTable.Row>
                      <DataTable.HeaderCell className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Input name="checkbox-example-header" type="checkbox" />
                      </DataTable.HeaderCell>
                      <DataTable.HeaderCell className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors">
                        <div className="flex items-center">
                          Cliente / Empresa
                          <span className="ml-1 text-gray-400">↕</span>
                        </div>
                      </DataTable.HeaderCell>
                      <DataTable.HeaderCell className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors">
                        <div className="flex items-center">
                          Segmento
                          <span className="ml-1 text-gray-400">↕</span>
                        </div>
                      </DataTable.HeaderCell>
                      <DataTable.HeaderCell className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Tags
                      </DataTable.HeaderCell>
                      <DataTable.HeaderCell className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors">
                        <div className="flex items-center">
                          Última Interação
                          <span className="ml-1 text-gray-400">↕</span>
                        </div>
                      </DataTable.HeaderCell>
                      <DataTable.HeaderCell className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Próximo Passo
                      </DataTable.HeaderCell>
                      <DataTable.HeaderCell className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Ações
                      </DataTable.HeaderCell>
                    </DataTable.Row>
                  </DataTable.Header>
                  {/* Body com estilos do StyleGuide: bg-card divide-y divide-border */}
                  <DataTable.Body className="bg-card divide-y divide-border">
                    {/* Linha com estilos do StyleGuide: hover:bg-secondary transition-colors cursor-pointer group */}
                    <DataTable.Row className="hover:bg-secondary transition-colors cursor-pointer group">
                      {/* Checkbox de seleção com estilos do StyleGuide: rounded border-input */}
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <Input
                          name="checkbox-example"
                          type="checkbox"
                          className="rounded border-input text-primary focus:ring-ring"
                        />
                      </DataTable.Cell>
                      {/* Coluna Cliente/Empresa com avatar e informações */}
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* Avatar circular com inicial do nome */}
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold mr-3 border border-border">
                            J
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              João Silva
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                              <Building2 size={10} className="mr-1" /> Tech
                              Solutions
                            </div>
                          </div>
                        </div>
                      </DataTable.Cell>
                      {/* Coluna Segmento com badge estilizado */}
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                          Tecnologia
                        </span>
                      </DataTable.Cell>
                      {/* Coluna Tags com badges estilizados */}
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border text-muted-foreground">
                            <Tag size={10} className="mr-1" /> VIP
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-card border border-border text-muted-foreground">
                            <Tag size={10} className="mr-1" /> Premium
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            +2
                          </span>
                        </div>
                      </DataTable.Cell>
                      {/* Coluna Última Interação com ícone de relógio */}
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock
                            size={14}
                            className="mr-1.5 text-muted-foreground"
                          />
                          há 2 dias
                        </div>
                      </DataTable.Cell>
                      {/* Coluna Próximo Passo */}
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">
                          Nada agendado
                        </span>
                      </DataTable.Cell>
                      {/* Coluna Ações com dropdown menu */}
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div
                          className="flex justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActionsMenu
                            triggerIcon={MoreHorizontal}
                            actions={[
                              {
                                icon: Eye,
                                label: "Visualizar",
                                onClick: () => {},
                              },
                              {
                                icon: Edit,
                                label: "Editar",
                                onClick: () => {},
                              },
                              {
                                icon: Trash2,
                                label: "Excluir",
                                variant: "danger",
                                onClick: () => {},
                              },
                            ]}
                          />
                        </div>
                      </DataTable.Cell>
                    </DataTable.Row>
                    {/* Segunda linha de exemplo */}
                    <DataTable.Row className="hover:bg-secondary transition-colors cursor-pointer group">
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <Input
                          name="checkbox-example-2"
                          type="checkbox"
                          className="rounded border-input"
                        />
                      </DataTable.Cell>
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold mr-3 border border-border">
                            M
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              Maria Santos
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                              <Building2 size={10} className="mr-1" /> Retail
                              Corp
                            </div>
                          </div>
                        </div>
                      </DataTable.Cell>
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-foreground border border-border">
                          Varejo
                        </span>
                      </DataTable.Cell>
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        </div>
                      </DataTable.Cell>
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Clock
                            size={14}
                            className="mr-1.5 text-muted-foreground"
                          />
                          há 1 semana
                        </div>
                      </DataTable.Cell>
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-muted-foreground">
                          Nada agendado
                        </span>
                      </DataTable.Cell>
                      <DataTable.Cell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div
                          className="flex justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActionsMenu
                            triggerIcon={MoreHorizontal}
                            actions={[
                              {
                                icon: Eye,
                                label: "Visualizar",
                                onClick: () => {},
                              },
                              {
                                icon: Edit,
                                label: "Editar",
                                onClick: () => {},
                              },
                              {
                                icon: Trash2,
                                label: "Excluir",
                                variant: "danger",
                                onClick: () => {},
                              },
                            ]}
                          />
                        </div>
                      </DataTable.Cell>
                    </DataTable.Row>
                  </DataTable.Body>
                </DataTable.Root>
              </div>
            </div>
            <div className="bg-secondary p-4 mt-6 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Especificações da Tabela
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>
                  • Header:{" "}
                  <code className="bg-card px-1 rounded">bg-secondary</code> com{" "}
                  <code className="bg-card px-1 rounded">px-6 py-4</code>
                </li>
                <li>
                  • Linhas:{" "}
                  <code className="bg-card px-1 rounded">
                    hover:bg-secondary
                  </code>{" "}
                  para interatividade
                </li>
                <li>
                  • Divisores:{" "}
                  <code className="bg-card px-1 rounded">
                    divide-y divide-border
                  </code>
                </li>
                <li>
                  • Checkboxes:{" "}
                  <code className="bg-card px-1 rounded">
                    rounded border-input
                  </code>
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 7. Empty States */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Inbox size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Estados Vazios
            </h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Empty State Padrão
              </p>
              <div className="bg-card p-16 text-center rounded-xl border border-border">
                <div className="bg-secondary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                  <Package size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-medium text-lg mb-2">
                  Nenhum item encontrado
                </h3>
                <p className="text-muted-foreground text-sm">
                  Comece criando seu primeiro item.
                </p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Empty State com Ação
              </p>
              <div className="bg-card p-16 text-center rounded-xl border border-border">
                <div className="bg-secondary w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                  <Users size={40} className="text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-medium text-lg mb-2">
                  Nenhum cliente cadastrado
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Comece adicionando seu primeiro cliente.
                </p>
                <Button variant="primary" size="lg">
                  <Plus size={18} /> Novo Cliente
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 8. Loading States */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Loader2 size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Estados de Carregamento
            </h2>
          </div>
          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Loading Spinner
              </p>

              <Loading message="Carregando..." />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Skeleton Loading (Padrão)
              </p>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
                <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
              </div>
            </div>
          </Card>
        </section>

        {/* 9. Pagination */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <ChevronsLeft size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Paginação</h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Componente de Paginação
              </p>
              <Pagination
                pagination={{
                  total: 150,
                  limit: 10,
                  page: paginationPage,
                  totalPages: 15,
                  hasNext: paginationPage < 15,
                  hasPrev: paginationPage > 1,
                }}
                onPageChange={setPaginationPage}
              />
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Características
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Navegação com primeira/última página</li>
                <li>• Indicador de página atual destacado</li>
                <li>• Ellipsis para muitas páginas</li>
                <li>• Responsivo com indicador simples no mobile</li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 10. SearchableSelect */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Search size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              SearchableSelect
            </h2>
          </div>
          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Componente Customizado
              </p>
              <div className="max-w-md mb-6">
                <SearchableSelect
                  options={[
                    {
                      label: "João Silva",
                      value: "1",
                      subtitle: "Tech Solutions",
                    },
                    {
                      label: "Maria Santos",
                      value: "2",
                      subtitle: "Global Retail",
                    },
                    {
                      label: "Pedro Costa",
                      value: "3",
                      subtitle: "StartUp Inc",
                    },
                  ]}
                  value={selectValue}
                  onChange={setSelectValue}
                  placeholder="Selecione um cliente..."
                />
              </div>
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Funcionalidades
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• Busca em tempo real</li>
                <li>• Suporte a subtítulos</li>
                <li>• Navegação por teclado (Arrow keys, Enter, Escape)</li>
                <li>• Indicador visual de seleção</li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 11. Modals & Dialogs */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <LayoutIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Modais e Diálogos
            </h2>
          </div>
          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Padrão de Modal de Criação
              </p>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Todos os modais de criação de entidades seguem este padrão
                visual e estrutural:
              </p>

              {/* Exemplo de Modal */}
              <div className="relative bg-secondary rounded-xl border-2 border-dashed border-input p-8">
                <div className="bg-card rounded-xl shadow-lg w-full max-w-[500px] mx-auto border border-border overflow-hidden">
                  {/* Header do Modal */}
                  <div className="flex justify-between items-center p-6 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground">
                      Novo Cliente
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-muted-foreground"
                    >
                      <X size={20} />
                    </Button>
                  </div>

                  {/* Conteúdo do Form */}
                  <div className="p-8 space-y-6">
                    <div>
                      <Input
                        name="modal-nome"
                        label="Nome Completo"
                        type="text"
                        placeholder="Ex: João Silva"
                        value={modalNome}
                        onChange={(e) => setModalNome(e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        name="modal-organization"
                        label="Organização"
                        type="text"
                        placeholder="Ex: Zpto Tecnologia Ltda"
                        value={modalEmpresa}
                        onChange={(e) => setModalEmpresa(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Footer do Modal */}
                  <div className="p-6 bg-secondary flex justify-end gap-3 border-t border-border">
                    <Button variant="secondary" size="lg">
                      Cancelar
                    </Button>
                    <Button variant="primary" size="lg">
                      Salvar Cliente
                    </Button>
                  </div>
                </div>
              </div>

              {/* Especificações */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="bg-secondary p-4 rounded-lg border border-border">
                  <p className="font-bold text-foreground mb-2">
                    Estrutura do Modal
                  </p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>
                      • Container:{" "}
                      <code className="bg-card px-1 rounded">w-[500px]</code>{" "}
                      max-width
                    </li>
                    <li>
                      • Header:{" "}
                      <code className="bg-card px-1 rounded">p-6</code> padding
                    </li>
                    <li>
                      • Conteúdo:{" "}
                      <code className="bg-card px-1 rounded">
                        p-8 space-y-6
                      </code>
                    </li>
                    <li>
                      • Footer:{" "}
                      <code className="bg-card px-1 rounded">
                        p-6 bg-secondary
                      </code>
                    </li>
                  </ul>
                </div>
                <div className="bg-secondary p-4 rounded-lg border border-border">
                  <p className="font-bold text-foreground mb-2">
                    Regras de Padronização
                  </p>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Todos os modais seguem o mesmo padding</li>
                    <li>
                      • Footer sempre com{" "}
                      <code className="bg-card px-1 rounded">bg-secondary</code>
                    </li>
                    <li>• Botões de ação no footer alinhados à direita</li>
                    <li>
                      • Botão primário:{" "}
                      <code className="bg-card px-1 rounded">bg-card</code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Componentes Dialog e Confirm - Exemplos Interativos */}
          <Card variant="default">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Componentes Dialog e Confirm
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Exemplos interativos dos componentes customizados do sistema
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Dialog com Lorem Ipsum */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Dialog (Conteúdo)
                  </h4>
                  <Button
                    onClick={() => setDialogOpen(true)}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    Abrir Dialog
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Dialog padrão com conteúdo customizado
                  </p>
                </div>

                {/* Confirm Excluir */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Confirm (Excluir)
                  </h4>
                  <Button
                    onClick={() => setConfirmOpen(true)}
                    variant="primary"
                    size="md"
                    className="w-full bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                  >
                    Excluir Item
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Dialog de confirmação para ações destrutivas
                  </p>
                </div>

                {/* Input Dialog (Tag) */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Input Dialog (Tag)
                  </h4>
                  <Button
                    onClick={() => setTagDialogOpen(true)}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    Adicionar Tag
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Dialog com input para adicionar tags
                  </p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Confirmar (padrão do sistema)
                  </h4>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setConfirmExampleOpen(true)}
                  >
                    Abrir Confirmação
                  </Button>
                  <Confirm
                    open={confirmExampleOpen}
                    onClose={() => setConfirmExampleOpen(false)}
                    onConfirm={() => {
                      toast("Confirmado!", "success");
                      setConfirmExampleOpen(false);
                    }}
                    title="Você tem certeza?"
                    message="Esta ação não pode ser desfeita. Isso excluirá permanentemente o item selecionado."
                    confirmText="Confirmar"
                    cancelText="Cancelar"
                    variant="danger"
                  />
                  <p className="text-xs text-muted-foreground">
                    Componente <code>Confirm</code> — padrão para ações
                    destrutivas simples.
                  </p>
                </div>
              </div>
              <div>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground">
                    Confirmar com awareness gate
                  </h4>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setAwarenessExampleOpen(true)}
                  >
                    Abrir Confirmação com Awareness
                  </Button>
                  <ConfirmWithAwareness
                    open={awarenessExampleOpen}
                    onClose={() => setAwarenessExampleOpen(false)}
                    onConfirm={() =>
                      toast("Excluído com awareness!", "success")
                    }
                    title="Confirmar exclusão"
                    message={
                      <>
                        Quer mesmo excluir{" "}
                        <strong>Departamento Comercial</strong>? Essa ação não
                        pode ser desfeita.
                      </>
                    }
                    variant="danger"
                    confirmText="Excluir"
                  />
                  <p className="text-xs text-muted-foreground">
                    Componente <code>ConfirmWithAwareness</code> — padrão CRUD
                    do design system. Botão fica desabilitado até o usuário marcar a
                    checkbox de awareness.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* 12. Kanban Cards */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <LayoutIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Cards Kanban</h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Card de Oportunidade (Pipeline)
              </p>
              <div className="max-w-[280px] bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-move">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary">
                      Hot
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-muted-foreground"
                  >
                    <X size={14} />
                  </Button>
                </div>
                <h4 className="font-bold text-foreground mb-1 text-sm leading-snug">
                  Projeto {APP_NAME} Enterprise
                </h4>
                <p className="text-xs text-muted-foreground mb-3 font-medium">
                  Tech Solutions
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center text-foreground text-xs font-bold">
                    <DollarSign
                      size={12}
                      className="mr-0.5 text-muted-foreground"
                    />
                    R$ 120.000
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center text-[10px] font-medium text-muted-foreground">
                      <Clock size={10} className="mr-1" />
                      5d
                    </div>
                    <div className="w-5 h-5 rounded-full bg-indigo-100 border border-white shadow-sm flex items-center justify-center text-[8px] font-bold text-primary">
                      JS
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Especificações
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>
                  • Padding: <code className="bg-card px-1 rounded">p-4</code>
                </li>
                <li>
                  • Borda:{" "}
                  <code className="bg-card px-1 rounded">border-border</code>
                </li>
                <li>
                  • Hover:{" "}
                  <code className="bg-card px-1 rounded">hover:shadow-md</code>
                </li>
                <li>
                  • Cursor:{" "}
                  <code className="bg-card px-1 rounded">cursor-move</code> para
                  drag
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 13. Tabs */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <LayoutIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Tabs (Abas)</h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Tabs Horizontais
              </p>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-border bg-secondary/50 px-4 flex space-x-1">
                  <Button
                    onClick={() => setActiveTab("tab1")}
                    variant={activeTab === "tab1" ? "toggle-active" : "toggle"}
                    size="md"
                    active={activeTab === "tab1"}
                    className="border-b-2 border-transparent data-[active=true]:border-primary rounded-none px-4 py-3 bg-transparent"
                  >
                    Aba 1
                  </Button>
                  <Button
                    onClick={() => setActiveTab("tab2")}
                    variant={activeTab === "tab2" ? "toggle-active" : "toggle"}
                    size="md"
                    active={activeTab === "tab2"}
                    className="border-b-2 border-transparent data-[active=true]:border-primary rounded-none px-4 py-3 bg-transparent"
                  >
                    Aba 2
                  </Button>
                  <Button
                    onClick={() => setActiveTab("tab3")}
                    variant={activeTab === "tab3" ? "toggle-active" : "toggle"}
                    size="md"
                    active={activeTab === "tab3"}
                    className="border-b-2 border-transparent data-[active=true]:border-primary rounded-none px-4 py-3 bg-transparent"
                  >
                    Aba 3
                  </Button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === "tab1" && (
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Conteúdo da Aba 1
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Este é o conteúdo da primeira aba.
                      </p>
                    </div>
                  )}
                  {activeTab === "tab2" && (
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Conteúdo da Aba 2
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Este é o conteúdo da segunda aba.
                      </p>
                    </div>
                  )}
                  {activeTab === "tab3" && (
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        Conteúdo da Aba 3
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Este é o conteúdo da terceira aba.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Tabs com Ícones
              </p>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="border-b border-border bg-secondary/50 px-4 flex space-x-1">
                  <Button
                    onClick={() => setActiveTab("icon1")}
                    variant={activeTab === "icon1" ? "toggle-active" : "toggle"}
                    size="md"
                    active={activeTab === "icon1"}
                    className="border-b-2 border-transparent data-[active=true]:border-primary rounded-none px-4 py-3"
                  >
                    <User size={16} />
                    <span>Usuários</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("icon2")}
                    variant={activeTab === "icon2" ? "toggle-active" : "toggle"}
                    size="md"
                    active={activeTab === "icon2"}
                    className="border-b-2 border-transparent data-[active=true]:border-primary rounded-none px-4 py-3"
                  >
                    <Settings size={16} />
                    <span>Configurações</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab("icon3")}
                    variant={activeTab === "icon3" ? "toggle-active" : "toggle"}
                    size="md"
                    active={activeTab === "icon3"}
                    className="border-b-2 border-transparent data-[active=true]:border-primary rounded-none px-4 py-3"
                  >
                    <BarChart2 size={16} />
                    <span>Relatórios</span>
                  </Button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground">
                    Conteúdo da aba selecionada...
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary p-4 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Especificações
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>
                  • Container:{" "}
                  <code className="bg-card px-1 rounded">bg-secondary/50</code>{" "}
                  para navegação
                </li>
                <li>
                  • Ativo:{" "}
                  <code className="bg-card px-1 rounded">
                    border-primary text-primary bg-card
                  </code>
                </li>
                <li>
                  • Inativo:{" "}
                  <code className="bg-card px-1 rounded">
                    text-muted-foreground hover:text-foreground
                  </code>
                </li>
                <li>
                  • Borda inferior:{" "}
                  <code className="bg-card px-1 rounded">border-b-2</code> para
                  indicador
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 14. SlideOver */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <LayoutIcon size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">SlideOver</h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Componente SlideOver Funcional
              </p>
              <Button
                onClick={() => setIsSlideOverOpen(true)}
                variant="primary"
                size="lg"
              >
                Abrir SlideOver
              </Button>
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Especificações
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>
                  • Larguras: <code className="bg-card px-1 rounded">md</code>{" "}
                  (max-w-md), <code className="bg-card px-1 rounded">lg</code>{" "}
                  (max-w-lg), <code className="bg-card px-1 rounded">xl</code>{" "}
                  (max-w-xl)
                </li>
                <li>
                  • Header:{" "}
                  <code className="bg-card px-1 rounded">px-6 py-6</code> com
                  título e subtítulo opcional
                </li>
                <li>
                  • Conteúdo:{" "}
                  <code className="bg-card px-1 rounded">
                    px-6 py-6 bg-secondary/50
                  </code>{" "}
                  com scroll automático
                </li>
                <li>
                  • Backdrop:{" "}
                  <code className="bg-card px-1 rounded">
                    bg-card/20 backdrop-blur-sm
                  </code>
                </li>
                <li>
                  • Animação: slide da direita com{" "}
                  <code className="bg-card px-1 rounded">duration-300</code>
                </li>
                <li>
                  • Z-index: <code className="bg-card px-1 rounded">z-50</code>{" "}
                  para sobreposição
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* SlideOver Component */}
        <SlideOver
          isOpen={isSlideOverOpen}
          onClose={() => setIsSlideOverOpen(false)}
          title="Exemplo de SlideOver"
          subtitle="Este é um exemplo funcional do componente SlideOver"
          width="md"
        >
          <div className="space-y-4">
            <div>
              <Input
                name="filter-nome"
                label="Nome"
                type="text"
                placeholder="Digite o nome..."
                value={filterNome}
                onChange={(e) => setFilterNome(e.target.value)}
              />
            </div>
            <div>
              <TextArea
                name="filter-descricao"
                label="Descrição"
                placeholder="Digite a descrição..."
                rows={6}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                onClick={() => setIsSlideOverOpen(false)}
                variant="secondary"
                size="lg"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => setIsSlideOverOpen(false)}
                variant="primary"
                size="lg"
              >
                Salvar
              </Button>
            </div>
          </div>
        </SlideOver>

        {/* 14. Filters & Toolbar */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Search size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Filtros e Toolbar
            </h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Toolbar de Filtros
              </p>
              <div className="bg-card p-4 border-b border-border bg-secondary/50 rounded-t-xl border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
                      Prioridade:
                    </span>
                    {(["all", "high", "medium", "low"] as const).map((f) => (
                      <Button
                        key={f}
                        variant={f === "all" ? "toggle-active" : "toggle"}
                        size="sm"
                        active={f === "all"}
                        className="capitalize"
                      >
                        {f === "all" ? "Todas" : f}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <div className="bg-accent p-1 rounded-lg border border-border flex">
                      <Button
                        variant={"toggle-active"}
                        size="icon-sm"
                        title="Lista"
                      >
                        <List size={16} />
                      </Button>
                      <Button
                        variant={"toggle"}
                        size="icon-sm"
                        title="Quadro Kanban"
                      >
                        <LayoutGrid size={16} />
                      </Button>
                      <Button
                        variant={"toggle"}
                        size="icon-sm"
                        title="Calendário"
                      >
                        <Calendar size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative w-64">
                      <Input
                        name="filter-search"
                        type="text"
                        placeholder="Buscar..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="pl-9 py-2"
                      />
                      <Search
                        size={16}
                        className="absolute left-3 bottom-[0.625rem] text-muted-foreground pointer-events-none z-10"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="text-muted-foreground hover:text-primary hover:border-primary"
                    >
                      <Filter size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-secondary p-4 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">Padrões</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>
                  • Background:{" "}
                  <code className="bg-card px-1 rounded">bg-secondary/50</code>
                </li>
                <li>
                  • Filtros ativos:{" "}
                  <code className="bg-card px-1 rounded">
                    bg-card border-input shadow-sm
                  </code>
                </li>
                <li>
                  • Busca com ícone:{" "}
                  <code className="bg-card px-1 rounded">pl-9</code> para espaço
                  do ícone
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 15. Icons */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Palette size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Ícones</h2>
          </div>
          <Card variant="default">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Tamanhos Padrão
              </p>
              <div className="grid grid-cols-4 gap-6 items-center">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Search size={12} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">12px</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Tiny</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Search size={16} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">16px</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Small
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Search size={20} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">20px</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Medium (Padrão)
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Search size={24} className="text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">24px</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Large
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Cores e Estados
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg border border-border">
                  <Search size={20} className="text-muted-foreground mb-2" />
                  <p className="text-xs font-bold text-foreground">Padrão</p>
                  <p className="text-[10px] text-muted-foreground">
                    text-muted-foreground
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg border border-border">
                  <Search size={20} className="text-muted-foreground mb-2" />
                  <p className="text-xs font-bold text-foreground">
                    Secundário
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    text-muted-foreground
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg border border-border">
                  <Search size={20} className="text-primary mb-2" />
                  <p className="text-xs font-bold text-foreground">Primário</p>
                  <p className="text-[10px] text-muted-foreground">
                    text-primary
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg border border-border">
                  <Search size={20} className="text-muted-foreground mb-2" />
                  <p className="text-xs font-bold text-foreground">
                    Desabilitado
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    text-muted-foreground
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Ícones de Ação
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Plus size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Adicionar</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Edit size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Editar</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Trash2 size={18} className="text-red-600" />
                  <span className="text-sm text-foreground">Excluir</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Save size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Salvar</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Copy size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Duplicar</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Send size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Enviar</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Check
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-sm text-foreground">Confirmar</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <X size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Cancelar</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Ícones de Navegação
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <LayoutDashboard
                    size={18}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-foreground">Dashboard</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Users size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Clientes</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <FolderKanban size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Pipeline</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <CheckSquare size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Tarefas</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Inbox size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Inbox</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Receipt size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Financeiro</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <BarChart2 size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Relatórios</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Settings size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Configurações</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Ícones de Status
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <CheckCircle2
                    size={18}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-sm text-foreground">Sucesso</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <AlertCircle size={18} className="text-amber-600" />
                  <span className="text-sm text-foreground">Atenção</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <AlertTriangle size={18} className="text-red-600" />
                  <span className="text-sm text-foreground">Erro</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Info size={18} className="text-blue-600" />
                  <span className="text-sm text-foreground">Informação</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Clock size={18} className="text-muted-foreground" />
                  <span className="text-sm text-foreground">Pendente</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-card border border-border rounded-lg">
                  <Loader2 size={18} className="text-primary animate-spin" />
                  <span className="text-sm text-foreground">Carregando</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Ícones em Botões
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="md">
                  <Plus size={16} />
                  Novo Item
                </Button>
                <Button variant="secondary" size="md">
                  <Edit size={16} />
                  Editar
                </Button>
                <Button variant="destructive" size="md">
                  <Trash2 size={16} />
                  Excluir
                </Button>
                <Button variant="secondary" size="icon">
                  <MoreHorizontal size={18} />
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Ícones com Texto (Inline)
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail size={14} className="mr-2 text-muted-foreground" />
                  <span>email@exemplo.com</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar size={14} className="mr-2 text-muted-foreground" />
                  <span>15 de Janeiro, 2024</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock size={14} className="mr-2 text-muted-foreground" />
                  <span>há 2 dias</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign
                    size={14}
                    className="mr-2 text-muted-foreground"
                  />
                  <span>R$ 120.000</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building2 size={14} className="mr-2 text-muted-foreground" />
                  <span>Tech Solutions</span>
                </div>
              </div>
            </div>

            <div className="bg-secondary p-4 mt-6 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Biblioteca de Ícones
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                O projeto utiliza <strong>Lucide React</strong> como biblioteca
                de ícones. Todos os ícones seguem o mesmo padrão visual e podem
                ser importados diretamente.
              </p>
              <div className="bg-card p-3 rounded border border-border">
                <code className="text-xs text-foreground">
                  import {"{"} Plus, Edit, Trash2 {"}"} from
                  &apos;lucide-react&apos;;
                </code>
              </div>
            </div>
          </Card>
        </section>

        {/* 16. Progress Bars */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <TrendingUp size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Progress Bars</h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Progress Bar Padrão
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Progresso
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      75%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Completo
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      100%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-600 h-2 rounded-full"
                      style={{ width: "100%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Inicial
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      25%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "25%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Progress Bar com Cores por Status
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Alta Probabilidade
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                      85%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-600 h-2 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Média Probabilidade
                    </span>
                    <span className="text-sm font-bold">55%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "55%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Baixa Probabilidade
                    </span>
                    <span className="text-sm font-bold text-muted-foreground">
                      30%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "30%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Progress Bar Grande (h-3)
              </p>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Upload de Arquivo
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      60%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-300"
                      style={{ width: "60%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Progress Bar Pequena (h-1)
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Etapa 1 de 4
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      25%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div
                      className="bg-primary h-1 rounded-full"
                      style={{ width: "25%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Progress Bar com Label Interno
              </p>
              <div className="space-y-4">
                <div className="relative">
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-primary h-4 rounded-full flex items-center justify-end pr-2"
                      style={{ width: "65%" }}
                    >
                      <span className="text-[10px] font-bold text-white">
                        65%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-600 h-4 rounded-full flex items-center justify-end pr-2"
                      style={{ width: "90%" }}
                    >
                      <span className="text-[10px] font-bold text-white">
                        90%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Progress Bar com Múltiplas Etapas
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-20 text-xs font-medium text-muted-foreground">
                    Pipeline:
                  </div>
                  <div className="flex-1 flex space-x-1">
                    <div
                      className="flex-1 bg-emerald-500 dark:bg-emerald-600 h-2 rounded-l"
                      style={{ width: "20%" }}
                    ></div>
                    <div
                      className="flex-1 bg-primary h-2"
                      style={{ width: "30%" }}
                    ></div>
                    <div
                      className="flex-1 bg-amber-500 h-2"
                      style={{ width: "25%" }}
                    ></div>
                    <div
                      className="flex-1 bg-muted h-2 rounded-r"
                      style={{ width: "25%" }}
                    ></div>
                  </div>
                  <div className="w-16 text-xs font-bold text-foreground text-right">
                    75%
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Lead</span>
                  <span>Discovery</span>
                  <span>Proposta</span>
                  <span>Negociação</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Progress Bar Circular (Exemplo)
              </p>
              <div className="flex items-center justify-center space-x-8">
                <div className="relative w-24 h-24">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted-foreground"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.75)}`}
                      className="text-primary transition-all duration-300"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-foreground">
                      75%
                    </span>
                  </div>
                </div>
                <div className="relative w-20 h-20">
                  <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-muted-foreground"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="32"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={`${2 * Math.PI * 32 * (1 - 0.45)}`}
                      className="text-emerald-500 transition-all duration-300"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">
                      45%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-secondary p-4 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Especificações
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>
                  • Altura padrão:{" "}
                  <code className="bg-card px-1 rounded">h-2</code> (8px)
                </li>
                <li>
                  • Altura grande:{" "}
                  <code className="bg-card px-1 rounded">h-3</code> (12px)
                </li>
                <li>
                  • Altura pequena:{" "}
                  <code className="bg-card px-1 rounded">h-1</code> (4px)
                </li>
                <li>
                  • Background:{" "}
                  <code className="bg-card px-1 rounded">bg-muted</code>
                </li>
                <li>
                  • Fill:{" "}
                  <code className="bg-card px-1 rounded">bg-indigo-600</code>{" "}
                  (padrão)
                </li>
                <li>
                  • Cores por status: emerald (alta), indigo (média), slate
                  (baixa)
                </li>
                <li>
                  • Border radius:{" "}
                  <code className="bg-card px-1 rounded">rounded-full</code>
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 17. Avatar & User Display */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <User size={24} className="text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">
              Avatar e Exibição de Usuário
            </h2>
          </div>
          <Card variant="default">
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Avatares
              </p>
              <div className="flex items-center space-x-6">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold border border-border">
                  JS
                </div>
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-primary font-bold border-2 border-white shadow-sm">
                  MS
                </div>
                <Image
                  src="https://i.pravatar.cc/150?img=1"
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border border-white shadow-sm"
                />
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 text-xs font-bold border border-white">
                  PC
                </div>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
                Display de Usuário com Info
              </p>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-muted-foreground font-bold mr-3 border border-border">
                  J
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">
                    João Silva
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                    <Building2 size={10} className="mr-1" /> Tech Solutions
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-secondary p-4 mt-6 rounded-lg border border-border">
              <p className="font-bold text-foreground mb-2 text-sm">
                Tamanhos Padrão
              </p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>
                  • Pequeno:{" "}
                  <code className="bg-card px-1 rounded">h-8 w-8</code> (32px)
                </li>
                <li>
                  • Médio:{" "}
                  <code className="bg-card px-1 rounded">h-10 w-10</code> (40px)
                  - padrão
                </li>
                <li>
                  • Grande:{" "}
                  <code className="bg-card px-1 rounded">h-12 w-12</code> (48px)
                </li>
                <li>
                  • Sem imagem: usar iniciais com{" "}
                  <code className="bg-card px-1 rounded">bg-accent</code>
                </li>
              </ul>
            </div>
          </Card>
        </section>

        {/* 18. Primitivos shadcn/ui — usados quando NÃO há equivalente catalogado */}
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center space-x-3 border-b border-border pb-3">
            <Package size={24} className="text-muted-foreground" />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Primitivos UI (shadcn)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use apenas quando não houver componente catalogado em{" "}
                <code>@/components/*</code>. Ver{" "}
                <code>docs/COMPONENT_GUIDELINES.md</code>.
              </p>
            </div>
          </div>

          {/* Tooltip — usa o componente catalogado @/components/Tooltip */}
          <Card variant="default" title="Tooltip">
            <p className="text-xs text-muted-foreground mb-3">
              Componente catalogado:{" "}
              <code>{`<Tooltip content="...">{children}</Tooltip>`}</code>.
            </p>
            <div className="flex items-center gap-4">
              <Tooltip content="Este é um tooltip informativo">
                <Button variant="outline">Hover me</Button>
              </Tooltip>
              <Tooltip content="Tooltip com mais informações">
                <Button variant="secondary">Outro tooltip</Button>
              </Tooltip>
            </div>
          </Card>

          {/* Tabs — componente catalogado @/components/Tabs (variants: underline, pill) */}
          <Card variant="default" title="Tabs">
            <p className="text-xs text-muted-foreground mb-4">
              Componente catalogado: <code>@/components/Tabs</code>. Três
              variantes — <code>underline</code> (default, para páginas de
              detalhe), <code>pill</code> (para filtros) e{" "}
              <code>solid</code> (navegação com ícone).
            </p>

            <div className="space-y-6">
              {/* Variante underline */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Variante <code>underline</code>
                </p>
                <Tabs defaultValue="dados" variant="underline">
                  <div className="border-b border-border">
                    <Tabs.List>
                      <Tabs.Trigger value="dados">Dados</Tabs.Trigger>
                      <Tabs.Trigger value="timeline">Timeline</Tabs.Trigger>
                      <Tabs.Trigger value="arquivos">Arquivos</Tabs.Trigger>
                    </Tabs.List>
                  </div>
                  <div className="pt-4">
                    <Tabs.Content value="dados">
                      <p className="text-sm text-muted-foreground">
                        Conteúdo da aba <strong>Dados</strong>.
                      </p>
                    </Tabs.Content>
                    <Tabs.Content value="timeline">
                      <p className="text-sm text-muted-foreground">
                        Conteúdo da aba <strong>Timeline</strong>.
                      </p>
                    </Tabs.Content>
                    <Tabs.Content value="arquivos">
                      <p className="text-sm text-muted-foreground">
                        Conteúdo da aba <strong>Arquivos</strong>.
                      </p>
                    </Tabs.Content>
                  </div>
                </Tabs>
              </div>

              {/* Variante pill */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Variante <code>pill</code>
                </p>
                <Tabs defaultValue="todos" variant="pill">
                  <Tabs.List>
                    <Tabs.Trigger value="todos">Todos</Tabs.Trigger>
                    <Tabs.Trigger value="ativos">Ativos</Tabs.Trigger>
                    <Tabs.Trigger value="inativos">Inativos</Tabs.Trigger>
                  </Tabs.List>
                  <div className="pt-4">
                    <Tabs.Content value="todos">
                      <p className="text-sm text-muted-foreground">
                        Exibindo <strong>todos</strong> os registros.
                      </p>
                    </Tabs.Content>
                    <Tabs.Content value="ativos">
                      <p className="text-sm text-muted-foreground">
                        Exibindo apenas <strong>ativos</strong>.
                      </p>
                    </Tabs.Content>
                    <Tabs.Content value="inativos">
                      <p className="text-sm text-muted-foreground">
                        Exibindo apenas <strong>inativos</strong>.
                      </p>
                    </Tabs.Content>
                  </div>
                </Tabs>
              </div>

              {/* Variante solid */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Variante <code>solid</code>
                </p>
                <Tabs defaultValue="historico" variant="solid">
                  <Tabs.List>
                    <Tabs.Trigger value="historico">
                      <Clock className="h-4 w-4" />
                      Histórico de atendimentos
                    </Tabs.Trigger>
                    <Tabs.Trigger value="indicadores">
                      <BarChart2 className="h-4 w-4" />
                      Indicadores
                    </Tabs.Trigger>
                  </Tabs.List>
                  <div className="pt-4">
                    <Tabs.Content value="historico">
                      <p className="text-sm text-muted-foreground">
                        Conteúdo da aba <strong>Histórico de atendimentos</strong>.
                      </p>
                    </Tabs.Content>
                    <Tabs.Content value="indicadores">
                      <p className="text-sm text-muted-foreground">
                        Conteúdo da aba <strong>Indicadores</strong>.
                      </p>
                    </Tabs.Content>
                  </div>
                </Tabs>
              </div>
            </div>
          </Card>

          {/* Dropdown — componente catalogado @/components/Dropdown (+ RowActionsMenu) */}
          <Card variant="default" title="Dropdown">
            <p className="text-xs text-muted-foreground mb-4">
              Componente catalogado: <code>@/components/Dropdown</code>. API
              flexível com <code>items[]</code> (tipos: <code>item</code>,{" "}
              <code>separator</code>, <code>label</code>, <code>radio</code>).
              Para menu de ações por linha em tabelas use a variação{" "}
              <code>RowActionsMenu</code>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Dropdown genérico */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  <code>Dropdown</code> genérico
                </p>
                <Dropdown
                  trigger={
                    <Button variant="outline" size="md">
                      Abrir menu <ChevronDown size={16} />
                    </Button>
                  }
                  items={
                    [
                      { type: "label", label: "Ações" },
                      {
                        type: "item",
                        icon: Eye,
                        label: "Visualizar",
                        onClick: () => toast("Visualizar", "info"),
                      },
                      {
                        type: "item",
                        icon: Edit,
                        label: "Editar",
                        onClick: () => toast("Editar", "info"),
                      },
                      { type: "separator" },
                      {
                        type: "item",
                        icon: Trash2,
                        label: "Excluir",
                        variant: "danger",
                        onClick: () => toast("Excluir", "error"),
                      },
                    ] satisfies DropdownItem[]
                  }
                />
              </div>

              {/* RowActionsMenu (uso em tabelas) */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  <code>RowActionsMenu</code> (linha de tabela)
                </p>
                <div className="inline-flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
                  <span className="text-sm text-foreground">João Silva</span>
                  <RowActionsMenu
                    actions={[
                      {
                        icon: Eye,
                        label: "Visualizar",
                        onClick: () => toast("Visualizar João", "info"),
                      },
                      {
                        icon: Edit,
                        label: "Editar",
                        onClick: () => toast("Editar João", "info"),
                      },
                      {
                        icon: Trash2,
                        label: "Excluir",
                        variant: "danger",
                        onClick: () => toast("Excluir João", "error"),
                      },
                    ]}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Separador entre <code>default</code> e <code>danger</code> é
                  injetado automaticamente.
                </p>
              </div>

              {/* Dropdown com radio (theme switcher) */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  <code>type: &quot;radio&quot;</code> (seleção exclusiva)
                </p>
                <Dropdown
                  contentClassName="w-40"
                  trigger={
                    <Button variant="outline" size="md">
                      {theme === "dark" ? (
                        <Moon size={16} />
                      ) : (
                        <Sun size={16} />
                      )}
                      <span className="capitalize">{theme}</span>
                      <ChevronDown size={16} />
                    </Button>
                  }
                  items={[
                    { type: "label", label: "Tema" },
                    { type: "separator" },
                    {
                      type: "radio",
                      value: theme,
                      onValueChange: (v) => setTheme(v as "light" | "dark"),
                      options: [
                        { value: "light", icon: Sun, label: "Light" },
                        { value: "dark", icon: Moon, label: "Dark" },
                      ],
                    },
                  ]}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Indicador de selecionado aparece à esquerda automaticamente.
                </p>
              </div>
            </div>
          </Card>

          {/* Popover — sem equivalente catalogado. Use ui/popover diretamente. */}
          <Card variant="default" title="Popover">
            <p className="text-xs text-muted-foreground mb-3">
              Primitivo shadcn (<code>@/components/ui/popover</code>). Sem
              equivalente catalogado — use diretamente.
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Abrir Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Informações</h4>
                  <p className="text-sm text-muted-foreground">
                    Este é um popover com conteúdo informativo.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </Card>

          {/* Separator — sem equivalente catalogado. Use ui/separator diretamente. */}
          <Card variant="default" title="Separator">
            <div className="space-y-4">
              <div>
                <p className="text-sm">Conteúdo acima</p>
                <Separator className="my-4" />
                <p className="text-sm">Conteúdo abaixo</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">Item 1</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm">Item 2</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm">Item 3</span>
              </div>
            </div>
          </Card>

          {/* Skeleton — primitivo. Para skeletons compostos use SkeletonBar de @/modules/common/skeleton. */}
          <Card variant="default" title="Skeleton">
            <p className="text-xs text-muted-foreground mb-3">
              Primitivo shadcn (<code>@/components/ui/skeleton</code>). Para
              skeletons compostos com shimmer use <code>SkeletonBar</code>/
              <code>SkeletonFullPage</code> de{" "}
              <code>@/modules/common/skeleton</code>.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>

          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold mb-4">
              Cards com Componente Reutilizável
            </p>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Exemplos de uso prático do componente{" "}
              <code className="bg-accent px-1 rounded">Card</code> em cenários
              comuns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exemplo: Mensagem de sucesso */}
              <Card
                variant="success"
                icon={<CheckCircle2 size={16} />}
                title="Dados Salvos"
                description="As alterações foram salvas com sucesso no sistema."
              />

              {/* Exemplo: Alerta importante */}
              <Card
                variant="warning"
                icon={<AlertTriangle size={16} />}
                title="Atenção Necessária"
                description="5 tarefas pendentes precisam de revisão urgente."
                action={{
                  label: "Revisar",
                  onClick: () => {
                    const event = new CustomEvent("show-toast", {
                      detail: { type: "info", message: "Abrindo tarefas..." },
                    });
                    window.dispatchEvent(event);
                  },
                }}
              />

              {/* Exemplo: Informação */}
              <Card
                variant="info"
                icon={<Info size={16} />}
                title="Nova Funcionalidade"
                description="Agora você pode exportar relatórios em PDF."
                action={{
                  label: "Saiba Mais",
                  onClick: () => {
                    const event = new CustomEvent("show-toast", {
                      detail: {
                        type: "info",
                        message: "Documentação em breve",
                      },
                    });
                    window.dispatchEvent(event);
                  },
                }}
              />

              {/* Exemplo: Premium */}
              <Card
                variant="purple"
                icon={<Sparkles size={16} />}
                title="Plano Premium"
                description="Desbloqueie recursos avançados e relatórios ilimitados."
                action={{
                  label: "Assinar",
                  onClick: () => {
                    const event = new CustomEvent("show-toast", {
                      detail: {
                        type: "success",
                        message: "Redirecionando...",
                      },
                    });
                    window.dispatchEvent(event);
                  },
                }}
              />
            </div>

            {/* Documentação de Uso */}
            <div className="bg-muted/30 p-6 rounded-xl border border-border space-y-4 mt-6">
              <div>
                <h3 className="text-base font-bold text-foreground mb-3">
                  📦 Componente Card
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Componente reutilizável com variants de cor. Suporta título,
                  ícone, descrição e botão de ação.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">Props:</h4>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    <li>
                      • <code className="bg-card px-1 rounded">variant</code> -
                      default | primary | success | warning | danger | info |
                      purple
                    </li>
                    <li>
                      • <code className="bg-card px-1 rounded">icon</code> -
                      ReactNode (ícone Lucide)
                    </li>
                    <li>
                      • <code className="bg-card px-1 rounded">title</code> -
                      string (título do card)
                    </li>
                    <li>
                      •{" "}
                      <code className="bg-card px-1 rounded">description</code>{" "}
                      - string (descrição)
                    </li>
                    <li>
                      • <code className="bg-card px-1 rounded">action</code> -{" "}
                      {`{ label, onClick }`} (botão)
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-foreground">
                    Exemplo:
                  </h4>
                  <pre className="bg-card p-3 rounded-lg text-xs overflow-x-auto">
                    <code className="text-muted-foreground">{`<Card
  variant="success"
  icon={<CheckCircle2 size={16} />}
  title="Sucesso"
  description="Operação concluída"
  action={{
    label: "Ver",
    onClick: () => {}
  }}
/>`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Dialog Components */}
      {/* Dialog com Lorem Ipsum */}
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Exemplo de Dialog"
        maxWidth="lg"
        footer={
          <>
            <Button
              onClick={() => setDialogOpen(false)}
              variant="secondary"
              size="md"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                toast("Ação executada com sucesso!", "success");
                setDialogOpen(false);
              }}
              variant="primary"
              size="md"
            >
              Confirmar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>
          <div className="bg-secondary p-4 rounded-lg border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Informação Adicional
            </p>
            <p className="text-sm text-foreground">
              Este é um exemplo de dialog com conteúdo mais extenso. O
              componente suporta scroll automático quando o conteúdo excede a
              altura disponível.
            </p>
          </div>
        </div>
      </Dialog>

      {/* Confirm Excluir */}
      <Confirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          toast("Item excluído com sucesso!", "success");
          setConfirmOpen(false);
        }}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        variant="danger"
      />

      {/* Input Dialog (Tag) */}
      <Dialog
        open={tagDialogOpen}
        onOpenChange={(open) => {
          setTagDialogOpen(open);
          if (!open) setTagValue("");
        }}
        title="Adicionar Tag"
        maxWidth="sm"
        footer={
          <>
            <Button
              onClick={() => {
                setTagDialogOpen(false);
                setTagValue("");
              }}
              variant="secondary"
              size="md"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (tagValue.trim()) {
                  toast(`Tag "${tagValue}" adicionada com sucesso!`, "success");
                  setTagDialogOpen(false);
                  setTagValue("");
                } else {
                  toast("Digite uma tag para adicionar", "warning");
                }
              }}
              variant="primary"
              size="md"
              disabled={!tagValue.trim()}
            >
              Adicionar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Digite a tag que deseja adicionar:
          </p>
          <Input
            name="tag-input"
            type="text"
            placeholder="Ex: VIP, Novo, Premium..."
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagValue.trim()) {
                toast(`Tag "${tagValue}" adicionada com sucesso!`, "success");
                setTagDialogOpen(false);
                setTagValue("");
              }
            }}
            autoFocus
          />
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => setTagValue("VIP")}
            >
              VIP
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => setTagValue("Novo")}
            >
              Novo
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => setTagValue("Premium")}
            >
              Premium
            </Badge>
            <Badge
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => setTagValue("Hot Lead")}
            >
              Hot Lead
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Dica: Clique em uma tag acima para usar rapidamente
          </p>
        </div>
      </Dialog>
    </>
  );
};

export default StyleGuide;
