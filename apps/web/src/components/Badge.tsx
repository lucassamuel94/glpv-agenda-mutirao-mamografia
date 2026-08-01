import {
  Badge as BadgeUI,
  BadgeProps as BadgePropsUI,
} from "@/components/ui/badge";
import { Sparkles, Flame, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
type BadgeType = "quantity" | "new" | "hot" | "tag" | null | "";
type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "destructive"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | null
  | "";
type BadgePosition =
  "top-right" | "top-left" | "bottom-right" | "bottom-left" | null | "";

const OUTLINE_CLASSES: Record<
  | "default"
  | "primary"
  | "secondary"
  | "destructive"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger",
  string
> = {
  default: "border-primary text-primary",
  primary: "border-primary text-primary",
  secondary: "border-secondary text-secondary",
  destructive: "border-destructive text-destructive",
  neutral: "border-border text-muted-foreground",
  info: "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300",
  success:
    "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
  warning:
    "border-amber-300 text-amber-800 dark:border-amber-800 dark:text-amber-300",
  danger: "border-red-300 text-red-700 dark:border-red-800 dark:text-red-300",
};

const SEMANTIC_CLASSES = {
  neutral: "border-border bg-secondary text-muted-foreground",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  danger:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
} as const;

interface BadgeProps extends Omit<BadgePropsUI, "variant"> {
  type?: BadgeType;
  variant?: BadgeVariant;
  outline?: boolean;
  position?: BadgePosition;
}

const Badge = ({
  children,
  type,
  variant,
  outline,
  position,
  ...props
}: BadgeProps) => {
  const hasPosition = position && position.length > 0;

  const badgeClassName = cn(
    hasPosition && "absolute",
    hasPosition && position === "top-right" && "-top-1 -right-1 z-20",
    hasPosition && position === "top-left" && "-top-1 -left-1 z-20",
    hasPosition && position === "bottom-right" && "-bottom-1 -right-1 z-20",
    hasPosition && position === "bottom-left" && "-bottom-1 -left-1 z-20",
  );
  const className = cn(badgeClassName, props.className);
  const resolvedVariant = (
    variant && variant.length > 0 ? variant : "default"
  ) as Exclude<BadgeVariant, null | "">;

  if (type === "quantity") {
    return (
      <BadgeUI
        variant="destructive"
        className={cn(
          className,
          "h-5 min-w-5 px-1.5 flex items-center justify-center text-[10px]",
        )}
      >
        {children}
      </BadgeUI>
    );
  }

  if (type === "new") {
    return (
      <BadgeUI
        variant="secondary"
        className={cn(
          className,
          "bg-primary/10 text-primary border-primary/30",
        )}
      >
        <Sparkles size={12} className="mr-1" />
        {children}
      </BadgeUI>
    );
  }

  if (type === "hot") {
    return (
      <BadgeUI
        variant="secondary"
        className={cn(
          className,
          "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600",
        )}
      >
        <Flame size={12} className="mr-1" />
        {children}
      </BadgeUI>
    );
  }
  if (type === "tag") {
    return (
      <BadgeUI
        variant="secondary"
        className={cn(
          className,
          "bg-muted/10 text-muted-foreground border-muted",
        )}
      >
        <Tag size={12} className="mr-1" />
        {children}
      </BadgeUI>
    );
  }
  const semanticClass =
    SEMANTIC_CLASSES[resolvedVariant as keyof typeof SEMANTIC_CLASSES];
  const uiVariant: NonNullable<BadgePropsUI["variant"]> = outline
    ? "outline"
    : resolvedVariant === "primary"
      ? "default"
      : semanticClass
        ? "outline"
        : (resolvedVariant as NonNullable<BadgePropsUI["variant"]>);
  const outlineClassName = outline
    ? OUTLINE_CLASSES[resolvedVariant]
    : undefined;

  return (
    <BadgeUI
      {...props}
      variant={uiVariant}
      className={cn(
        "font-medium",
        className,
        semanticClass,
        outlineClassName,
        props.className,
      )}
    >
      {children}
    </BadgeUI>
  );
};

Badge.displayName = "Badge";
export { Badge };
