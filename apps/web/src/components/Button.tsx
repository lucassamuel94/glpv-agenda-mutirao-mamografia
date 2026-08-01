"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/Tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "bg-card border border-border text-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-transparent text-foreground hover:bg-accent",
        link: "text-primary hover:underline underline-offset-4",
        toggle:
          "text-muted-foreground relative hover:text-foreground dark:text-muted-foreground dark:hover:text-foreground bg-transparent",
        "toggle-active":
          "bg-card relative text-foreground shadow-sm dark:bg-secondary dark:text-foreground",
      },
      size: {
        sm: "h-8 px-4 text-xs",
        md: "h-10 px-5 py-2",
        lg: "h-10 px-7 py-2.5",
        xl: "h-12 px-7 py-3 text-base font-semibold",
        icon: "h-10 w-10 p-2",
        "icon-sm": "h-8 w-8 p-1.5",
        "icon-lg": "h-10 w-10 p-2.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  active?: boolean;
  altText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, active, disabled, altText, asChild, ...props },
    ref,
  ) => {
    // Se for toggle e estiver ativo, usa variant toggle-active
    const finalVariant =
      variant === "toggle" && active ? "toggle-active" : variant;

    // Quando `asChild`, o Slot encaminha as props para o filho (ex.: <a>,
    // <Link>). Isso evita o warning "React does not recognize the `asChild`
    // prop on a DOM element" e permite que o conteúdo seja um link real.
    const Comp = asChild ? Slot : "button";

    const buttonEl = (
      <Comp
        className={cn(
          buttonVariants({ variant: finalVariant, size, className }),
        )}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={asChild ? undefined : disabled}
        data-active={active ? "true" : undefined}
        aria-label={altText || props["aria-label"]}
        {...props}
      />
    );

    if (altText || props["aria-label"]) {
      return (
        <Tooltip content={altText || props["aria-label"]}>{buttonEl}</Tooltip>
      );
    }

    return buttonEl;
  },
);

Button.displayName = "Button";

/** Props do CancelButton (padrão: secondary, "Cancelar") */
export interface CancelButtonProps extends Omit<
  ButtonProps,
  "variant" | "size"
> {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  children?: React.ReactNode;
}

/** Botão padrão para cancelar/fechar (modais, formulários). */
const CancelButton = React.forwardRef<HTMLButtonElement, CancelButtonProps>(
  (
    { variant = "secondary", size = "md", children = "Cancelar", ...props },
    ref,
  ) => (
    <Button ref={ref} variant={variant} size={size} type="button" {...props}>
      {children}
    </Button>
  ),
);
CancelButton.displayName = "CancelButton";

/** Props do SaveButton (padrão: primary, ícone Save, suporte a loading). */
export interface SaveButtonProps extends Omit<ButtonProps, "variant" | "size"> {
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** Quando true, exibe "Salvando…" e desabilita o botão */
  loading?: boolean;
  /** Texto quando não está loading (padrão: "Salvar") */
  children?: React.ReactNode;
  /** Tamanho do ícone Save (padrão: 18) */
  iconSize?: number;
}

/** Botão padrão para salvar/criar/atualizar (formulários, modais). */
const SaveButton = React.forwardRef<HTMLButtonElement, SaveButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      children = "Salvar",
      iconSize = 18,
      disabled,
      ...props
    },
    ref,
  ) => (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      type="submit"
      disabled={disabled ?? loading}
      {...props}
    >
      <Save size={iconSize} />
      {loading ? "Salvando…" : children}
    </Button>
  ),
);
SaveButton.displayName = "SaveButton";

export { Button, buttonVariants, CancelButton, SaveButton };
