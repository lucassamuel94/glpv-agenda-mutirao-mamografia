"use client";

import { useEffect } from "react";
import { installGlobalErrorHandlers } from "@/lib/report-error";

/** Instala os listeners de erro globais uma vez, no mount do layout raiz. */
export function GlobalErrorHandlers() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  return null;
}
