"use client";

import React, { useState, useEffect } from "react";
import { Building2, Palette, SlidersHorizontal } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { ColorPickerField, ImageUploadField } from "@/components";
import { Form, Input, Select, MaskedInput, useForm } from "@/components/Form";
import { Tabs } from "@/components/Tabs";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { AppBrandMark } from "@/components/AppBrand";
import {
  updateOrganizationSchema,
  type UpdateOrganizationFormValues,
} from "./update-organization-validation";
import { superAdminApi } from "@/lib/api/super-admin";
import type { OrganizationDetail } from "@/lib/api/super-admin";
import { toast } from "@/lib/toast";
import { EMAIL_SUPPORT, WHATSAPP_SUPPORT } from "@/environments";
import { OrganizationDialogHero, UserDialogSection } from "@/modules/common";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function OrganizationBrandPreview() {
  const { watch } = useForm<UpdateOrganizationFormValues>();
  const name = watch("name");
  const primaryColor = watch("primary_color");
  const logoUrl = watch("logo_url");
  const isValidColor = !!primaryColor && HEX_COLOR_PATTERN.test(primaryColor);

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 p-3">
      <AppBrandMark
        title={name || "Organização"}
        logoUrl={logoUrl || undefined}
        style={isValidColor ? { backgroundColor: primaryColor } : undefined}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {name || "Nome da organização"}
        </p>
        <p className="text-xs text-muted-foreground">
          Pré-visualização da marca
        </p>
      </div>
    </div>
  );
}

function OrganizationEditHero({ organization }: { organization: OrganizationDetail }) {
  const { watch } = useForm<UpdateOrganizationFormValues>();
  const name = watch("name") || organization.name;
  const cnpj = watch("cnpj") || formatCnpjForInput(organization.cnpj);
  const status = watch("status") || organization.status;

  return (
    <OrganizationDialogHero
      mode="edit"
      name={name}
      cnpj={cnpj}
      status={ORGANIZATION_STATUS_OPTIONS.find((option) => option.value === status)?.label || status}
      description="A organização é a identidade principal do ambiente e do seu whitelabel."
    />
  );
}

const ORGANIZATION_STATUS_OPTIONS = [
  { value: "ACTIVATION", label: "Ativação", indicator: "bg-amber-500" },
  { value: "ACTIVE", label: "Ativa", indicator: "bg-emerald-500" },
  { value: "SUSPENDED", label: "Suspensa", indicator: "bg-orange-500" },
  { value: "CANCELLED", label: "Cancelada", indicator: "bg-red-500" },
];

interface EditOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string | null; // organization id (prop name kept for compatibility)
  onSuccess?: () => void;
}

function formatCnpjForInput(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function EditOrganizationDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: EditOrganizationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOrganization, setLoadingOrganization] = useState(false);
  const [organization, setOrganization] = useState<OrganizationDetail | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"general" | "appearance" | "preferences">("general");

  useResetOnChange(`${open} ${organizationId}`, () => setActiveTab("general"));

  // Busca da organização ao abrir — efeito legítimo (sincroniza com a API). O
  // `setOrganization(null)` do caminho fechado é limpeza antes de buscar de
  // novo, no mesmo efeito que faz o fetch; separá-lo num render-time reset
  // dividiria uma decisão só em dois lugares.
  useEffect(() => {
    if (!open || !organizationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrganization(null);
      return;
    }
    setLoadingOrganization(true);
    superAdminApi
      .getOrganization(organizationId)
      .then((res) => {
        if (res.data) setOrganization(res.data);
        if (res.error) toast(res.error, "error");
      })
      .finally(() => setLoadingOrganization(false));
  }, [open, organizationId]);

  const handleSubmit = async (data: UpdateOrganizationFormValues) => {
    if (!organizationId) return;
    setIsLoading(true);
    try {
      const payload: {
        name?: string;
        cnpj?: string;
        address?: string;
        status?: string;
        primary_color?: string;
        logo_url?: string;
        icon_url?: string;
        theme?: string;
        density?: string;
        locale?: string;
        timezone?: string;
        date_format?: string;
      } = {};
      if (data.name !== undefined && data.name.trim())
        payload.name = data.name.trim();
      if (data.cnpj !== undefined && data.cnpj)
        payload.cnpj = data.cnpj.replace(/\D/g, "");
      if (data.address !== undefined)
        payload.address = data.address?.trim() || undefined;
      if (data.status !== undefined) payload.status = data.status;
      if (data.primary_color !== undefined)
        payload.primary_color = data.primary_color?.trim() || undefined;
      if (data.logo_url !== undefined)
        payload.logo_url = data.logo_url?.trim() || undefined;
      if (data.icon_url !== undefined)
        payload.icon_url = data.icon_url?.trim() || undefined;
      if (data.theme !== undefined) payload.theme = data.theme;
      if (data.density !== undefined) payload.density = data.density;
      if (data.locale !== undefined) payload.locale = data.locale;
      if (data.timezone !== undefined) payload.timezone = data.timezone;
      if (data.date_format !== undefined)
        payload.date_format = data.date_format;

      const res = await superAdminApi.updateOrganization(
        organizationId,
        payload,
      );
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao atualizar organização.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Editar organização"
      subtitle="Atualize a identidade, a marca e as preferências desta empresa."
      maxWidth="4xl"
      footer={
        <>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            variant="secondary"
            size="md"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="edit-organization-form"
            variant="primary"
            size="md"
            disabled={isLoading || loadingOrganization}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      {loadingOrganization ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : organization ? (
        <Form
          key={organization.id}
          id="edit-organization-form"
          schema={updateOrganizationSchema}
          defaultValues={{
            name: organization.name,
            cnpj: formatCnpjForInput(organization.cnpj),
            address: organization.address ?? "",
            status: organization.status,
            primary_color: organization.primary_color ?? "#4f46e5",
            logo_url: organization.logo_url ?? "",
            icon_url: organization.icon_url ?? organization.favicon_url ?? "",
            theme: organization.theme ?? "light",
            density: organization.density ?? "compact",
            locale: organization.locale ?? "pt-BR",
            timezone: organization.timezone ?? "America/Sao_Paulo",
            date_format: organization.date_format ?? "DD/MM/YYYY",
          }}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isLoading={isLoading}
          showDefaultButtons={false}
          className="space-y-5"
        >
          <OrganizationDialogHero
            mode="edit"
            name={organization.name}
            cnpj={formatCnpjForInput(organization.cnpj)}
            status={ORGANIZATION_STATUS_OPTIONS.find((option) => option.value === organization.status)?.label || organization.status}
            description="A organização é a identidade principal do ambiente e do seu whitelabel."
          />
          <div className="space-y-7 rounded-xl border border-border bg-card p-5 sm:p-6">
            <UserDialogSection title="Identidade da organização" description="Atualize os dados cadastrais e o estado operacional.">
              <div className="grid gap-4 md:grid-cols-2">
                <Input name="name" label="Nome da organização" placeholder="Razão social" />
                <MaskedInput type="cnpj" name="cnpj" label="CNPJ" placeholder="00.000.000/0000-00" />
                <Input name="address" label="Endereço (opcional)" placeholder="Rua, número, bairro..." />
                <Select name="status" label="Status" placeholder="Selecione" options={ORGANIZATION_STATUS_OPTIONS} />
              </div>
            </UserDialogSection>
            <div className="border-t border-border pt-7">
              <UserDialogSection title="Marca e aparência" description="Defina como a organização será apresentada no sistema.">
                <div className="space-y-5">
                  <ColorPickerField
                    name="primary_color"
                    label="Cor principal"
                    helpTip="Escolha a cor principal da interface"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ImageUploadField
                      name="logo_url"
                      label="Logo"
                      helper="Imagem principal da empresa"
                    />
                    <ImageUploadField
                      name="icon_url"
                      label="Ícone / favicon"
                      helper="Imagem quadrada usada também como favicon"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      name="theme"
                      label="Tema padrão"
                      options={[
                        { value: "light", label: "Claro" },
                        { value: "dark", label: "Escuro" },
                        { value: "system", label: "Sistema" },
                      ]}
                    />
                    <Select
                      name="density"
                      label="Densidade da interface"
                      options={[
                        { value: "compact", label: "Compacta" },
                        { value: "comfortable", label: "Confortável" },
                        { value: "spacious", label: "Espaçosa" },
                      ]}
                    />
                  </div>
                  <OrganizationBrandPreview />
                </div>
              </UserDialogSection>
            </div>
            <div className="border-t border-border pt-7">
              <UserDialogSection title="Preferências do sistema" description="Defina os padrões usados por esta organização.">
                <div className="grid gap-4 md:grid-cols-3">
                  <Select name="locale" label="Idioma" options={[{ value: "pt-BR", label: "Português (Brasil)" }]} />
                  <Select name="timezone" label="Fuso horário" options={[{ value: "America/Sao_Paulo", label: "São Paulo (GMT-03:00)" }]} />
                  <Select name="date_format" label="Formato de data" options={[{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }]} />
                </div>
              </UserDialogSection>
            </div>
            <div className="border-t border-border pt-7">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Suporte EZ Soft:</strong>{" "}
                {EMAIL_SUPPORT} · {WHATSAPP_SUPPORT}
              </p>
            </div>
          </div>
        </Form>
      ) : null}
    </Dialog>
  );
}
