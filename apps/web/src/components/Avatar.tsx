import Image from "next/image";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Avatar as AvatarUI,
  AvatarFallback as AvatarFallbackUI,
  AvatarImage as AvatarImageUI,
} from "@/components/ui/avatar";
/**
 * Avatar component
 *
 * @param src - The source of the avatar
 * @param alt - The alt text of the avatar
 * @param size - The size of the avatar
 * @returns The Avatar component
 */
const DEFAULT_SIZE = 40;

const avatarSizeClasses = {
  sm: "size-11",
  md: "size-14",
  lg: "size-16",
  xl: "size-20",
  xxl: "size-24",
};

const fontSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
  xxl: "text-xl",
};
export type AvatarProps = {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl" | "xxl";
  failbackIcon?: React.ReactNode;
  className?: string;
  initialFallback?: string;
  initialMax?: number;
};

export function Avatar({
  src,
  alt,
  size = "md",
  failbackIcon,
  className,
  initialFallback,
  initialMax,
}: AvatarProps) {
  const avatarSize = avatarSizeClasses[size];
  const fontSize = fontSizeClasses[size];

  return (
    <div className={"relative shrink-0"}>
      <AvatarUI className={cn(avatarSize, "rounded-full bg-muted", className)}>
        {src ? (
          <AvatarImageUI src={src} alt={alt} className="object-cover" />
        ) : null}
        <AvatarFallbackUI
          className={cn(
            "rounded-full bg-muted text-muted-foreground",
            fontSize,
          )}
        >
          {failbackIcon ?? getInitials(alt, initialFallback, initialMax)}
        </AvatarFallbackUI>
      </AvatarUI>
    </div>
  );
}
