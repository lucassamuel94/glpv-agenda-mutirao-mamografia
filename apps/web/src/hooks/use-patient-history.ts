"use client";

import useSWR from "swr";
import { invalidateAllForPrefix } from "./use-generic-cache";
import { appointmentsApi, type CancellationReason } from "@/lib/api/appointments";
import { API_CONFIG } from "@/lib/api/config";

const HISTORY_PREFIX = API_CONFIG.CACHE.KEYS.PATIENT_HISTORY;

/** /pacientes histórico + cancelamento com motivo (RN-35..40, RN-53). */
export function usePatientHistory(patientId: string | null) {
  const key = patientId ? `${HISTORY_PREFIX}-list-${patientId}` : null;
  const { data, error, isLoading } = useSWR(key, async () => {
    const response = await appointmentsApi.history(patientId as string);
    if (response.error) throw new Error(response.error);
    return response.data;
  });

  const cancelAction = async (appointmentId: string, reason: CancellationReason) => {
    const response = await appointmentsApi.cancel(appointmentId, reason);
    if (response.error) throw new Error(response.error);
    await invalidateAllForPrefix(HISTORY_PREFIX);
    return response.data;
  };

  return { data, error, isLoading, cancelAction };
}
