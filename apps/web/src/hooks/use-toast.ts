/**
 * useToast Hook
 *
 * Hook para disparar toasts customizados do sistema.
 *
 * @module hooks/use-toast
 */

import { useCallback } from "react";
import {
  toast,
  toastSuccess,
  toastError,
  toastWarning,
  toastInfo,
  type ToastType,
} from "@/lib/toast";

/**
 * Hook para usar toasts no sistema
 *
 * @returns Objeto com funções para disparar toasts
 *
 * @example
 * ```tsx
 * import { useToast } from '@/hooks/use-toast';
 *
 * function MyComponent() {
 *   const { toast, success, error, warning, info } = useToast();
 *
 *   const handleAction = async () => {
 *     try {
 *       await someAction();
 *       success('Ação realizada com sucesso!');
 *     } catch (err) {
 *       error('Erro ao realizar ação');
 *     }
 *   };
 *
 *   return <button onClick={handleAction}>Executar</button>;
 * }
 * ```
 */
export const useToast = () => {
  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      toast(message, type);
    },
    []
  );

  const success = useCallback((message: string) => {
    toastSuccess(message);
  }, []);

  const error = useCallback((message: string) => {
    toastError(message);
  }, []);

  const warning = useCallback((message: string) => {
    toastWarning(message);
  }, []);

  const info = useCallback((message: string) => {
    toastInfo(message);
  }, []);

  return {
    toast: showToast,
    success,
    error,
    warning,
    info,
  };
};
