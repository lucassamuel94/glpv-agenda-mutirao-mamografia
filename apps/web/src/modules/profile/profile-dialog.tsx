"use client";

import React, { useRef, useState } from "react";
import {
  BriefcaseBusiness,
  Building2,
  Camera,
  Check,
  Circle,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Lock,
  Mail,
  Moon,
  Pencil,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useResetOnChange } from "@/hooks/use-reset-on-change";
import { toast } from "@/lib/toast";
import { strongPasswordSchema } from "@/lib/password-schema";
import { useTheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { Avatar } from "@/components/Avatar";
import { Tabs } from "@/components/Tabs";
import { Form } from "@/components/Form";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { Dropdown } from "@/components/Dropdown";
import { Input as InputField } from "@/components/Form/Fields/Input";
import { ColorPickerField } from "@/components/ColorPickerField";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

type ProfileTab = "profile" | "links" | "security" | "preferences";
type InterfaceTheme = "light" | "dark";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  SA_MASTER: "Administrador da plataforma",
  SA_BILLING: "Financeiro da plataforma",
  SA_USER: "Equipe da plataforma",
  ADMIN: "Administrador",
  MANAGER: "Gestor",
  COORDINATOR: "Coordenador",
  USER: "Usuário",
};

const PASSWORD_REQUIREMENTS = [
  { label: "Pelo menos 8 caracteres", test: (value: string) => value.length >= 8 },
  { label: "Uma letra maiúscula", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Uma letra minúscula", test: (value: string) => /[a-z]/.test(value) },
  { label: "Um número", test: (value: string) => /\d/.test(value) },
];

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const handleKeyState = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(
      typeof event.getModifierState === "function" &&
      event.getModifierState("CapsLock"),
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyState}
          onKeyUp={handleKeyState}
          onFocus={() => setCapsLockOn(false)}
          onBlur={() => setCapsLockOn(false)}
          className="h-10 pr-10"
          aria-label={label}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {capsLockOn && (
        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
          Caps Lock está ativado.
        </p>
      )}
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { theme, setTheme } = useTheme();
  const { user: currentUser, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [selectedTheme, setSelectedTheme] = useState<InterfaceTheme>(
    theme === "dark" ? "dark" : "light",
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cropImageSrc, setCropImageSrc] = useState("");
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useResetOnChange(
    `${open} ${currentUser?.id} ${currentUser?.name} ${currentUser?.email} ${currentUser?.avatarUrl} ${theme} ${currentUser?.preferences?.primaryColor}`,
    () => {
      if (!open || !currentUser) return;
      setActiveTab("profile");
      setFormData({
        name: currentUser.name || "",
        email: currentUser.email || "",
      });
      setSelectedTheme(theme === "dark" ? "dark" : "light");
      setSelectedColor(currentUser.preferences?.primaryColor || null);
      setPassword("");
      setPasswordConfirmation("");
      setAvatarPreview(currentUser.avatarUrl || "");
    },
  );

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Selecione uma imagem válida.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast("A imagem deve ter no máximo 2 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setCropImageSrc(reader.result);
        setIsCropDialogOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedImage: string) => {
    setAvatarPreview(croppedImage);
    setCropImageSrc("");
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview("");
    setCropImageSrc("");
    setIsCropDialogOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (activeTab === "links") return;

    if (activeTab === "security") {
      const passwordResult = strongPasswordSchema.safeParse(password);
      if (!passwordResult.success) {
        toast(passwordResult.error.issues[0]?.message || "Senha inválida.", "error");
        return;
      }
      if (password !== passwordConfirmation) {
        toast("As senhas não coincidem.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      const payload =
        activeTab === "profile"
          ? {
            name: formData.name.trim(),
            avatarUrl: avatarPreview,
          }
          : activeTab === "security"
            ? { newPassword: password }
            : {
                preferences: {
                  theme: selectedTheme,
                  primaryColor: selectedColor,
                },
              };

      const response = await updateProfile(payload);
      if (!response.data) {
        toast(response.error || "Não foi possível salvar as alterações.", "error");
        return;
      }

      if (activeTab === "preferences") setTheme(selectedTheme);
      setPassword("");
      setPasswordConfirmation("");
      toast("Alterações salvas com sucesso.", "success");
    } catch {
      toast("Não foi possível salvar as alterações.", "error");
    } finally {
      setSaving(false);
    }
  };

  const organizations = currentUser?.organizations ?? [];
  const currentOrganization = organizations.find((organization) => organization.is_current) ?? organizations[0];
  const roleLabel = currentUser?.role ? ROLE_LABELS[currentUser.role] || currentUser.role : "Usuário";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Minha conta"
      subtitle="Gerencie suas informações pessoais e preferências."
      maxWidth="5xl"
      footer={
        activeTab === "links" ? (
          <Button type="button" onClick={() => onOpenChange(false)} variant="secondary">
            Fechar
          </Button>
        ) : (
          <>
            <Button type="button" onClick={() => onOpenChange(false)} variant="secondary">
              Cancelar
            </Button>
            <Button type="submit" form="profile-form" variant="primary" disabled={saving}>
              <Save size={16} aria-hidden="true" />
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </>
        )
      }
    >
      <form id="profile-form" onSubmit={handleSave} className="space-y-6">
        <section className="rounded-xl border border-border bg-gradient-to-br from-muted/50 via-muted/20 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex shrink-0 flex-col items-center gap-3 sm:w-40">
              {avatarPreview ? (
                <Dropdown
                  align="center"
                  trigger={
                    <button
                      type="button"
                      className="group relative h-auto rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      aria-label="Ajustar foto de perfil"
                    >
                      <Avatar
                        src={avatarPreview}
                        alt={formData.name}
                        size="xxl"
                        className="size-28 ring-2 ring-background"
                        failbackIcon={<User size={42} />}
                      />
                      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                        <Camera size={21} aria-hidden="true" />
                      </span>
                    </button>
                  }
                  items={[
                    {
                      type: "item",
                      icon: Pencil,
                      label: "Alterar foto",
                      onClick: () => fileInputRef.current?.click(),
                    },
                    {
                      type: "item",
                      icon: Trash2,
                      label: "Remover foto",
                      variant: "danger",
                      onClick: handleRemoveAvatar,
                    },
                  ]}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-auto rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  aria-label="Adicionar foto de perfil"
                >
                  <Avatar
                    src={avatarPreview}
                    alt={formData.name}
                    size="xxl"
                    className="size-28 ring-2 ring-background"
                    failbackIcon={<User size={42} />}
                  />
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <ImagePlus size={21} aria-hidden="true" />
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <p className="text-center text-[11px] leading-4 text-muted-foreground">
                {avatarPreview ? "Clique na foto para ajustar" : "JPG, PNG ou WEBP até 2 MB"}
              </p>
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-col gap-0.5 w-max">
                <h3 className="text-xl font-semibold text-foreground">{formData.name || "Usuário"}</h3>

                <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                <Mail size={14} aria-hidden="true" />
                {formData.email || "E-mail não informado"}
              </p>

                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-medium text-foreground mt-1">
                  <ShieldCheck size={13} aria-hidden="true" />
                  {roleLabel}
                </span>

              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span><strong className="mr-1 text-foreground">{organizations.length}</strong> organizações vinculadas</span>
                {currentOrganization && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} aria-hidden="true" />
                    {currentOrganization.name}
                  </span>
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {avatarPreview ? "A nova foto será aplicada ao salvar o perfil." : "Adicione uma foto para personalizar sua identificação no sistema."}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProfileTab)} variant="underline">
            <Tabs.List className="flex justify-start gap-4 overflow-x-auto border-b border-border pt-1 px-2 sm:px-3">
              <Tabs.Trigger value="profile" className="flex items-center gap-1"><User size={15} aria-hidden="true" />Perfil</Tabs.Trigger>
              <Tabs.Trigger value="links" className="flex items-center gap-1"><BriefcaseBusiness size={15} aria-hidden="true" />Vínculos</Tabs.Trigger>
              <Tabs.Trigger value="security" className="flex items-center gap-1"><KeyRound size={15} aria-hidden="true" />Segurança</Tabs.Trigger>
              <Tabs.Trigger value="preferences" className="flex items-center gap-1"><SlidersHorizontal size={15} aria-hidden="true" />Preferências</Tabs.Trigger>
            </Tabs.List>

            <div className="p-5 sm:p-6">
              <Tabs.Content value="profile">
                <SectionHeading title="Informações pessoais" description="Atualize seus dados de cadastro e contato." />
                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    name="name"
                    label="Nome completo"
                    required
                    value={formData.name}
                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  />
                  <InputField name="email" label="E-mail" value={formData.email} disabled />
                </div>
              </Tabs.Content>

              <Tabs.Content value="links">
                <SectionHeading title="Vínculos" description="Organizações associadas ao seu acesso." />
                <div className="space-y-3">
                  {organizations.length > 0 ? organizations.map((organization) => (
                    <div key={organization.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                      <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground"><Building2 size={17} aria-hidden="true" /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{organization.name}</p>
                        <p className="text-xs text-muted-foreground">{organization.plan || "Organização"}</p>
                      </div>
                      {organization.is_current && <span className="text-xs font-medium text-primary">Atual</span>}
                    </div>
                  )) : (
                    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhuma organização vinculada.</p>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="security">
                <SectionHeading title="Segurança da conta" description="Mantenha sua senha forte e única." />
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"><Lock size={17} aria-hidden="true" /></span>
                    <div><p className="text-sm font-medium text-foreground">Alterar senha</p><p className="mt-1 text-xs text-muted-foreground">A nova senha precisa seguir todos os requisitos de segurança.</p></div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <PasswordField label="Nova senha" value={password} onChange={setPassword} />
                    <PasswordField label="Repetir nova senha" value={passwordConfirmation} onChange={setPasswordConfirmation} />
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-3" aria-label="Requisitos da senha">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Requisitos da senha</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {PASSWORD_REQUIREMENTS.map((requirement) => {
                        const met = requirement.test(password);
                        return <div key={requirement.label} className={met ? "flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400" : "flex items-center gap-2 text-xs text-muted-foreground"}>{met ? <Check size={14} /> : <Circle size={10} />}<span>{requirement.label}</span></div>;
                      })}
                    </div>
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value="preferences">
                <SectionHeading title="Preferências" description="Personalize a aparência do sistema." />
                <div className="space-y-3">
                  <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground"><Sun size={17} aria-hidden="true" /></span><div><p className="text-sm font-medium text-foreground">Tema</p><p className="text-xs text-muted-foreground">Escolha como a interface será exibida.</p></div></div>
                    <div className="flex rounded-lg bg-muted p-1">
                      <button type="button" onClick={() => setSelectedTheme("light")} className={selectedTheme === "light" ? "flex h-9 items-center gap-2 rounded-md bg-card px-3 text-xs font-medium text-foreground shadow-sm" : "flex h-9 items-center gap-2 rounded-md px-3 text-xs text-muted-foreground hover:text-foreground"}><Sun size={14} />Claro</button>
                      <button type="button" onClick={() => setSelectedTheme("dark")} className={selectedTheme === "dark" ? "flex h-9 items-center gap-2 rounded-md bg-card px-3 text-xs font-medium text-foreground shadow-sm" : "flex h-9 items-center gap-2 rounded-md px-3 text-xs text-muted-foreground hover:text-foreground"}><Moon size={14} />Escuro</button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <Form
                      disableFormElement
                      showDefaultButtons={false}
                      onSubmit={() => {}}
                      defaultValues={{ primaryColor: selectedColor ?? "#4f46e5" }}
                      onChange={(data) =>
                        setSelectedColor((data.primaryColor as string) ?? null)
                      }
                    >
                      <ColorPickerField
                        name="primaryColor"
                        label="Cor primária"
                        defaultColor={selectedColor ?? "#4f46e5"}
                        helpTip="Sua cor pessoal — sobrepõe a cor da organização, só pra você."
                      />
                    </Form>
                  </div>
                </div>
              </Tabs.Content>
            </div>
          </Tabs>
        </section>
      </form>
      <ImageCropDialog
        open={isCropDialogOpen}
        onOpenChange={(openState) => {
          setIsCropDialogOpen(openState);
          if (!openState) setCropImageSrc("");
        }}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        title="Ajustar foto de perfil"
      />
    </Dialog>
  );
}
