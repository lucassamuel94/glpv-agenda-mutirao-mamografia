"use client";

import useSWR from "swr";
import { invalidateAllForPrefix } from "./use-generic-cache";
import { clinicsApi } from "@/lib/api/clinics";
import { schedulingApi } from "@/lib/api/scheduling";
import type {
  Availability,
  SlotPeriod,
  SlotSuggestion,
} from "@/lib/api/scheduling";
import { API_CONFIG } from "@/lib/api/config";

const SLOTS_PREFIX = API_CONFIG.CACHE.KEYS.AGENDA_SLOTS;

export function useClinics() {
  const { data, error, isLoading } = useSWR("clinics-list", async () => {
    const response = await clinicsApi.list();
    if (response.error) throw new Error(response.error);
    return response.data;
  });
  return { data, error, isLoading };
}

/** /agenda grade por clínica/dia (RN-32). `clinicId`/`date` nulos só desabilitam o fetch da grade. */
export function useAgendaSlots(clinicId: string | null, date: string | null) {
  const key = clinicId && date ? `${SLOTS_PREFIX}-list-${clinicId}-${date}` : null;
  const { data, error, isLoading } = useSWR(key, async () => {
    const response = await schedulingApi.slots(clinicId as string, date as string);
    if (response.error) throw new Error(response.error);
    return response.data;
  });

  const bookAction = async (payload: {
    slotId: string;
    patientId: string;
    birthDate: string;
    hasMammographyWithin12Months: boolean;
  }) => {
    const response = await schedulingApi.manualBooking(payload);
    if (response.error) throw new Error(response.error);
    await invalidateAllForPrefix(SLOTS_PREFIX);
    return response.data;
  };

  return { data, error, isLoading, bookAction };
}

/**
 * Disponibilidade do intervalo + fila de equilíbrio das clínicas. Alimenta o
 * calendário de densidade e a barra de equilíbrio com UMA requisição.
 */
export function useAvailability(params: {
  from: string;
  to: string;
  clinicId?: string;
  period?: SlotPeriod;
}) {
  const key = `${SLOTS_PREFIX}-availability-${params.from}-${params.to}-${params.clinicId ?? "all"}-${params.period ?? "all"}`;

  const { data, error, isLoading, mutate } = useSWR<Availability>(key, async () => {
    const response = await schedulingApi.availability(params);
    if (response.error) throw new Error(response.error);
    return response.data as Availability;
  });

  return { data, error, isLoading, refresh: mutate };
}

/** Melhores encaixes para a janela/turno pedidos (item 4 do plano de UX). */
export function useSuggestions(params: {
  from: string;
  to: string;
  period?: SlotPeriod;
  limit?: number;
  enabled?: boolean;
}) {
  const enabled = params.enabled ?? true;
  const key = enabled
    ? `${SLOTS_PREFIX}-suggest-${params.from}-${params.to}-${params.period ?? "all"}-${params.limit ?? 3}`
    : null;

  const { data, error, isLoading } = useSWR<SlotSuggestion[]>(key, async () => {
    const response = await schedulingApi.suggest(params);
    if (response.error) throw new Error(response.error);
    return response.data as SlotSuggestion[];
  });

  return { data, error, isLoading };
}

/**
 * Horários de UM dia em várias clínicas, para a expansão do calendário.
 *
 * Reaproveita o endpoint por clínica/dia em paralelo em vez de criar outro: o
 * fan-out aqui é do tamanho do número de clínicas (3) e só acontece no dia que a
 * operadora abriu — o problema que motivou o endpoint de disponibilidade era
 * varrer TODOS os dias, não um.
 */
export function useDaySlots(day: string | null, clinicIds: string[]) {
  const key = day && clinicIds.length ? `${SLOTS_PREFIX}-day-${day}-${clinicIds.join(",")}` : null;

  const { data, error, isLoading } = useSWR(key, async () => {
    const responses = await Promise.all(
      clinicIds.map((clinicId) => schedulingApi.slots(clinicId, day as string)),
    );
    const failed = responses.find((response) => response.error);
    if (failed?.error) throw new Error(failed.error);
    return responses.flatMap((response) => response.data ?? []);
  });

  return { data, error, isLoading };
}

/**
 * Hold otimista: segura a vaga antes de abrir o formulário e devolve quando a
 * operadora desiste. Sem isso, a vaga pode ser tomada por uma oferta do bot no
 * meio do preenchimento e o erro só apareceria no "Confirmar".
 */
export function useSlotHold() {
  const hold = async (slotId: string) => {
    const response = await schedulingApi.hold(slotId);
    if (response.error) throw new Error(response.error);
    await invalidateAllForPrefix(SLOTS_PREFIX);
    return response.data;
  };

  const release = async (slotId: string) => {
    // Best-effort: se falhar, o cron de reservas expiradas devolve a vaga.
    try {
      await schedulingApi.releaseHold(slotId);
      await invalidateAllForPrefix(SLOTS_PREFIX);
    } catch {
      // silencioso de propósito — não há ação do usuário aqui
    }
  };

  return { hold, release };
}
