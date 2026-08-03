"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Patient } from "@/lib/api/patients";

interface NewBookingContextValue {
  isOpen: boolean;
  /** Abre o modal. Opcionalmente já pula o passo 1 com a paciente pré-selecionada. */
  open: (patient?: Patient) => void;
  close: () => void;
  /** Paciente pré-selecionada (vinda da lista de espera, tela de pacientes, etc). */
  preselectedPatient: Patient | null;
}

const NewBookingContext = createContext<NewBookingContextValue | null>(null);

export function NewBookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preselectedPatient, setPreselectedPatient] = useState<Patient | null>(null);

  const open = useCallback((patient?: Patient) => {
    setPreselectedPatient(patient ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Não limpa a paciente no close — o modal interno faz o reset completo ao
    // fechar, e preservar aqui evita flash de estado vazio durante a animação.
  }, []);

  return (
    <NewBookingContext.Provider value={{ isOpen, open, close, preselectedPatient }}>
      {children}
    </NewBookingContext.Provider>
  );
}

export function useNewBooking(): NewBookingContextValue {
  const ctx = useContext(NewBookingContext);
  // Graceful degradation: sem provider o botão renderiza mas não faz nada.
  // Isso cobre o Layout em testes unitários isolados e qualquer contexto em que
  // o provider ainda não subiu na árvore (ex: renderização parcial em SSR).
  if (!ctx) {
    return {
      isOpen: false,
      open: () => {},
      close: () => {},
      preselectedPatient: null,
    };
  }
  return ctx;
}
