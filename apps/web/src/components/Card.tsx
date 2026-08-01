"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const cardVariants = cva("rounded-lg", {
  variants: {
    variant: {
      default: "bg-card border border-border",
      primary: "bg-primary/5 border border-primary/25",
      success: "bg-emerald-500/5 border border-emerald-500/25",
      warning: "bg-amber-500/5 border border-amber-500/25",
      danger: "bg-red-500/5 border border-red-500/25",
      info: "bg-blue-500/5 border border-blue-500/25",
      purple: "bg-purple-500/5 border border-purple-500/25",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const cardTitleVariants = cva("text-lg font-bold flex items-center", {
  variants: {
    variant: {
      default: "text-foreground",
      primary: "text-indigo-900 dark:text-indigo-300",
      success: "text-emerald-900 dark:text-emerald-300",
      warning: "text-amber-900 dark:text-amber-300",
      danger: "text-red-900 dark:text-red-300",
      info: "text-blue-900 dark:text-blue-300",
      purple: "text-purple-900 dark:text-purple-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const cardIconVariants = cva("mr-2", {
  variants: {
    variant: {
      default: "text-foreground",
      primary: "text-primary",
      success: "text-emerald-600 dark:text-emerald-400",
      warning: "text-amber-600 dark:text-amber-400",
      danger: "text-red-600 dark:text-red-400",
      info: "text-blue-600 dark:text-blue-400",
      purple: "text-purple-600 dark:text-purple-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const cardButtonVariants = cva("hover:bg-opacity-20 transition-colors", {
  variants: {
    variant: {
      default: "bg-secondary text-foreground hover:bg-muted",
      primary:
        "bg-primary/10 dark:bg-primary/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/30",
      success:
        "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/30",
      warning:
        "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/30",
      danger:
        "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/30",
      info: "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950/30",
      purple:
        "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Remove borda e box-shadow do card */
  unborder?: boolean;
}

// Função helper para verificar se há filhos CardHeader, CardContent ou CardFooter
function hasCardStructureChildren(children: React.ReactNode): boolean {
  if (!children) return false;

  const targetComponentNames = ["CardHeader", "CardContent", "CardFooter"];
  const targetComponents = [CardHeader, CardContent, CardFooter];

  const checkChild = (child: React.ReactNode): boolean => {
    if (!child) return false;

    if (React.isValidElement(child)) {
      const elementType = child.type;

      // Comparação direta de referência
      if (targetComponents.includes(elementType as any)) {
        return true;
      }

      // Verifica pelo nome da função do componente
      if (typeof elementType === "function") {
        const functionName = elementType.name;
        if (targetComponentNames.includes(functionName)) {
          return true;
        }
      }

      // Verifica recursivamente nos filhos
      // React 19: child.props virou unknown — precisamos castar para acessar.
      const childProps = child.props as { children?: React.ReactNode } | null;
      if (childProps?.children) {
        return hasCardStructureChildren(childProps.children);
      }
    }

    // Se for um array, verifica cada item
    if (Array.isArray(child)) {
      return child.some((item) => checkChild(item));
    }

    return false;
  };

  // Usa React.Children para percorrer todos os filhos
  // try-catch para evitar crash quando children contém objetos inválidos (ex.: Error)
  let hasStructure = false;
  try {
    React.Children.forEach(children, (child) => {
      if (!hasStructure && checkChild(child)) {
        hasStructure = true;
      }
    });
  } catch {
    return false;
  }

  return hasStructure;
}

/**
 * Card Component
 *
 * Componente de card reutilizável com variants de cor baseado no design system.
 * Suporta título, ícone, descrição e botão de ação opcional.
 *
 * @example
 * ```tsx
 * <Card
 *   variant="success"
 *   icon={<CheckCircle2 size={16} />}
 *   title="Card Success"
 *   description="Card com borda fina verde e background translúcido."
 *   action={{ label: "Ação", onClick: () => {} }}
 * />
 * ```
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      icon,
      title,
      description,
      action,
      children,
      unborder,
      ...props
    },
    ref,
  ) => {
    const hasStructure = hasCardStructureChildren(children);

    return (
      <div
        ref={ref}
        className={cn(
          "shadow-none",
          cardVariants({ variant }),
          unborder && "border-0 ring-0",
          hasStructure ? "py-6" : "p-6",
          className,
        )}
        {...props}
      >
        {(title || icon || action) && (
          <div className="flex items-center justify-between mb-4">
            {(title || icon) && (
              <h3 className={cn(cardTitleVariants({ variant }))}>
                {icon && (
                  <span className={cn(cardIconVariants({ variant }))}>
                    {icon}
                  </span>
                )}
                {title}
              </h3>
            )}
            {action && (
              <button
                onClick={action.onClick}
                className={cn(
                  "h-8 px-3 text-xs font-bold rounded-lg",
                  cardButtonVariants({ variant }),
                )}
              >
                {action.label}
              </button>
            )}
          </div>
        )}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
        {children}
      </div>
    );
  },
);

// Exportar CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent junto com o Card deste componente;
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
};

Card.displayName = "Card";
