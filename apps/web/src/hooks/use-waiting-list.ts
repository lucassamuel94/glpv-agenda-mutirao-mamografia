"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { invalidateAllForPrefix } from "./use-generic-cache";
import { waitingListApi } from "@/lib/api/waiting-list";
import { API_CONFIG } from "@/lib/api/config";

const CACHE_KEY_PREFIX = API_CONFIG.CACHE.KEYS.WAITING_LIST;
const LIST_KEY = `${CACHE_KEY_PREFIX}-list`;

/** RN-43..46: entrada, consulta, marcar como contatada e remoção lógica. */
export function useWaitingListActions() {
  const refetch = useCallback(() => invalidateAllForPrefix(CACHE_KEY_PREFIX), []);

  const addAction = async (payload: {
    patient_id: string;
    phone: string;
    alt_phone?: string;
    notes?: string;
  }) => {
    const response = await waitingListApi.create(payload);
    if (response.error) throw new Error(response.error);
    await refetch();
    return response.data;
  };

  const markContactedAction = async (id: string) => {
    const response = await waitingListApi.markContacted(id);
    if (response.error) throw new Error(response.error);
    await refetch();
  };

  const removeAction = async (id: string) => {
    const response = await waitingListApi.remove(id);
    if (response.error) throw new Error(response.error);
    await refetch();
  };

  return { addAction, markContactedAction, removeAction };
}

export function useWaitingList() {
  const { data, error, isLoading } = useSWR(LIST_KEY, async () => {
    const response = await waitingListApi.list();
    if (response.error) throw new Error(response.error);
    return response.data;
  });
  const actions = useWaitingListActions();
  return { data, error, isLoading, ...actions };
}
