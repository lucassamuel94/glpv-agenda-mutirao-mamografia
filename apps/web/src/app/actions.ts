"use server";

import { revalidatePath } from "next/cache";

/**
 * Invalida o `/auth/branding` cacheado no servidor (ver `generateMetadata` em
 * `app/layout.tsx`). Sem isto, o título da aba só acompanharia o nome da
 * organização depois do `revalidate` expirar — justamente na hora em que o
 * usuário acabou de digitar esse nome no /setup.
 */
export async function refreshBranding(): Promise<void> {
  // `"layout"` purga o layout raiz — é onde o fetch de /auth/branding vive.
  revalidatePath("/", "layout");
}
