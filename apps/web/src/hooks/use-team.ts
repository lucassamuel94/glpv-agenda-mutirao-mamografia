"use client";

import { useCallback } from "react";
import { useGenericData, type UseGenericConfig } from "./use-generic";
import { invalidateAllForPrefix } from "./use-generic-cache";
import { organizationUsersApi } from "@/lib/api/organization-users";
import type { TeamMember } from "@/types/team";
import { API_CONFIG } from "@/lib/api/config";

const CACHE_KEY_PREFIX = API_CONFIG.CACHE.KEYS.TEAM;

/**
 * Hook de actions: convites, criação direta e mutações individuais de membros.
 *
 * Toda action invalida o cache da listagem automaticamente — os consumidores
 * não precisam chamar `refetch` manualmente.
 */
export function useTeamActions() {
  const refetchTeam = useCallback(
    () => invalidateAllForPrefix(CACHE_KEY_PREFIX),
    [],
  );

  const inviteAction = async (payload: { email: string; role: string }) => {
    const response = await organizationUsersApi.invite({
      email: payload.email.trim().toLowerCase(),
      role: payload.role as TeamMember["role"],
    });

    if (response.error) {
      throw new Error(response.error);
    }

    await refetchTeam();
    return response.data;
  };

  const createUserAction = async (payload: {
    name: string;
    email: string;
    password: string;
    role: TeamMember["role"];
  }) => {
    const response = await organizationUsersApi.createUser({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: payload.role,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    await refetchTeam();
    return response.data;
  };

  /**
   * Ativa ou desativa um membro.
   * Cache invalidado automaticamente — view não precisa refetch manual.
   */
  const updateStatusAction = async (id: string, isActive: boolean) => {
    const response = await organizationUsersApi.updateStatus(id, isActive);

    if (response.error) {
      throw new Error(response.error);
    }

    await refetchTeam();
    return response.data;
  };

  /**
   * Remove o membro da equipe (não exclui o usuário do sistema).
   * Cache invalidado automaticamente.
   */
  const removeAction = async (id: string) => {
    const response = await organizationUsersApi.remove(id);

    if (response.error) {
      throw new Error(response.error);
    }

    await refetchTeam();
    return response.data;
  };

  /**
   * Remove múltiplos membros da equipe em massa.
   * Retorna `deleted` (removidos com sucesso) e `failed` (com motivo).
   * Cache invalidado automaticamente após o batch.
   */
  const bulkRemoveAction = async (ids: string[]) => {
    const response = await organizationUsersApi.bulkRemove(ids);

    if (response.error) {
      throw new Error(response.error);
    }

    await refetchTeam();
    return response.data as {
      deleted: number;
      failed: Array<{ id: string; reason: string }>;
      message?: string;
    };
  };

  /**
   * Ativa/desativa múltiplos membros em massa.
   * Cache invalidado automaticamente após o batch.
   */
  const bulkUpdateStatusAction = async (ids: string[], isActive: boolean) => {
    const response = await organizationUsersApi.bulkUpdateStatus(ids, isActive);

    if (response.error) {
      throw new Error(response.error);
    }

    await refetchTeam();
    return response.data as {
      updated: number;
      failed: Array<{ id: string; reason: string }>;
      message?: string;
    };
  };

  return {
    inviteAction,
    createUserAction,
    updateStatusAction,
    removeAction,
    bulkRemoveAction,
    bulkUpdateStatusAction,
    refetchTeam,
  };
}

/**
 * Hook de listagem da equipe (usuários da empresa).
 */
export function useTeamList(config?: Partial<UseGenericConfig<TeamMember>>) {
  return useGenericData<TeamMember>({
    fetcher: (params) => organizationUsersApi.list(params),
    cacheKeyPrefix: CACHE_KEY_PREFIX,
    defaultSortBy: "created_at",
    defaultSortOrder: "DESC",
    ...config,
  });
}

/**
 * Hook unificado: listagem + actions (invite, create, updateStatus, remove).
 */
export function useTeam(config?: Partial<UseGenericConfig<TeamMember>>) {
  const listHook = useTeamList(config);
  const actionsHook = useTeamActions();
  return {
    ...listHook,
    ...actionsHook,
  };
}
