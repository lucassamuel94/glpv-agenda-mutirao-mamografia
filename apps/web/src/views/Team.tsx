"use client";

import React, { useCallback, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/modules/common/empty-state";
import { ErrorMessage } from "@/modules/common/error-message";
import { SkeletonFullPage } from "@/modules/common/skeleton";
import Pagination from "@/components/Pagination";
import { Button } from "@/components/Button";
import { UserPlus, Trash2, UserMinus, UserCheck } from "lucide-react";
import { useTeam } from "@/hooks/use-team";
import {
  InviteUserDialog,
  EditTeamMemberDialog,
  TeamTable,
  TeamFilters,
} from "@/modules/team";
import { Confirm } from "@/components/Dialog";
import { ActionBar } from "@/components/ActionBar";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/lib/toast";
import type { TeamMember } from "@/types/team";
import InputSearch from "@/components/InputSearch";
import { TableSurface } from "@/components";

type BulkConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  variant: "default" | "danger";
  onConfirm: () => Promise<void>;
};

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deactivateMember, setDeactivateMember] = useState<TeamMember | null>(
    null,
  );
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkConfirm, setBulkConfirm] = useState<BulkConfirmState | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const {
    data,
    isLoading,
    error,
    pagination,
    filters,
    applyFilters,
    clearFilters,
    activeFiltersCount,
    goToPage,
    updateStatusAction,
    removeAction,
    bulkRemoveAction,
    bulkUpdateStatusAction,
  } = useTeam({
    initialPage: 1,
    initialLimit: 10,
  });

  // Lista paginada vem direto do backend (filtros já aplicados server-side)
  const items = useMemo(() => data || [], [data]);

  // Membros que podem entrar em seleção em massa (exclui self + primary).
  const selectableIds = useMemo(
    () =>
      items
        .filter((m) => m.id !== currentUser?.id && m.is_primary !== true)
        .map((m) => m.id),
    [items, currentUser?.id],
  );

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === selectableIds.length && selectableIds.length > 0
        ? []
        : selectableIds,
    );
  }, [selectableIds]);

  const handleEditSuccess = () => {
    setEditMember(null);
    toast("Membro atualizado com sucesso.", "success");
    // Cache invalidado automaticamente pelo hook de actions (via invalidateAll).
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateMember) return;
    setConfirmLoading(true);
    try {
      await updateStatusAction(deactivateMember.id, false);
      setDeactivateMember(null);
      toast("Membro desativado com sucesso.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao desativar.", "error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removeMember) return;
    setConfirmLoading(true);
    try {
      await removeAction(removeMember.id);
      setRemoveMember(null);
      toast("Membro removido da equipe com sucesso.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao remover.", "error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleActivate = async (member: TeamMember) => {
    try {
      await updateStatusAction(member.id, true);
      toast("Membro ativado com sucesso.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao ativar.", "error");
    }
  };

  // Apresenta o resultado de uma operação em massa com base nos contadores
  // de sucesso/falha retornados pelo backend.
  const notifyBulkResult = (
    affected: number,
    failedCount: number,
    successLabel: string,
    partialLabel: string,
    allFailedLabel: string,
  ) => {
    if (affected > 0 && failedCount === 0) {
      toast(`${affected} ${successLabel}`, "success");
    } else if (affected > 0 && failedCount > 0) {
      toast(`${affected} ${partialLabel} ${failedCount} falharam.`, "warning");
    } else {
      toast(allFailedLabel, "error");
    }
  };

  const runBulkRemove = async () => {
    setBulkLoading(true);
    try {
      const res = await bulkRemoveAction(selectedIds);
      setSelectedIds([]);
      setBulkConfirm(null);
      notifyBulkResult(
        res.deleted,
        res.failed.length,
        "membro(s) removido(s) com sucesso.",
        "removido(s);",
        "Nenhum membro pôde ser removido.",
      );
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao remover membros.",
        "error",
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const runBulkStatus = async (isActive: boolean) => {
    setBulkLoading(true);
    try {
      const res = await bulkUpdateStatusAction(selectedIds, isActive);
      setSelectedIds([]);
      setBulkConfirm(null);
      const verb = isActive ? "ativado(s)" : "desativado(s)";
      notifyBulkResult(
        res.updated,
        res.failed.length,
        `membro(s) ${verb} com sucesso.`,
        `${verb};`,
        `Nenhum membro pôde ser ${verb.replace("(s)", "")}.`,
      );
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao atualizar membros.",
        "error",
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkRemove = () => {
    if (selectedIds.length === 0) return;
    setBulkConfirm({
      open: true,
      title: "Remover membros",
      message: `Remover ${selectedIds.length} membro(s) da equipe? Eles perderão acesso a esta organização. Os usuários não serão excluídos do sistema.`,
      confirmText: "Sim, remover",
      variant: "danger",
      onConfirm: runBulkRemove,
    });
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.length === 0) return;
    setBulkConfirm({
      open: true,
      title: "Desativar membros",
      message: `Desativar ${selectedIds.length} membro(s)? Eles não poderão acessar a organização até serem reativados.`,
      confirmText: "Desativar",
      variant: "default",
      onConfirm: () => runBulkStatus(false),
    });
  };

  const handleBulkActivate = () => {
    if (selectedIds.length === 0) return;
    setBulkConfirm({
      open: true,
      title: "Ativar membros",
      message: `Ativar ${selectedIds.length} membro(s)? Eles voltarão a ter acesso à organização.`,
      confirmText: "Ativar",
      variant: "default",
      onConfirm: () => runBulkStatus(true),
    });
  };

  if (error) {
    return (
      <>
        <PageHeader title="Equipe" />
        <ErrorMessage error={error} />
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Equipe" isLoading />
        <SkeletonFullPage length={5} variant="list" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Equipe"
        description="Gerencie acessos, funções e status dos membros da organização."
        actions={
          <ActionBar>
            <Button
              onClick={() => setInviteOpen(true)}
              variant="primary"
              size="md"
            >
              <UserPlus size={18} /> Convidar usuário
            </Button>
          </ActionBar>
        }
      />
      <div className="flex flex-col space-y-6">
        <BulkActionsToolbar
          count={selectedIds.length}
          onCancel={() => setSelectedIds([])}
          primaryActions={[
            {
              label: "Remover",
              icon: Trash2,
              variant: "destructive",
              onClick: handleBulkRemove,
            },
          ]}
          secondaryActions={[
            {
              label: "Desativar",
              icon: UserMinus,
              onClick: handleBulkDeactivate,
            },
            {
              label: "Ativar",
              icon: UserCheck,
              onClick: handleBulkActivate,
            },
          ]}
        />

        {/* Table */}
        <TableSurface>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <InputSearch
                name="team-search"
                variant="default"
                placeholder="Buscar por nome ou e-mail"
                value={(filters.search as string) ?? ""}
                onSearch={(search) =>
                  applyFilters({ search: search.trim() || undefined })
                }
              />
            </div>
            <TeamFilters
              filters={filters}
              applyFilters={applyFilters}
              clearFilters={clearFilters}
              activeFiltersCount={activeFiltersCount}
            />
          </div>
          {items.length === 0 ? (
            <EmptyState
              kind="users"
              mode={activeFiltersCount > 0 ? "no-results" : "no-data"}
              title={activeFiltersCount > 0 ? "Nenhum membro encontrado" : "Nenhum membro cadastrado"}
              description={
                activeFiltersCount > 0
                  ? "Nenhum resultado com os filtros aplicados. Tente ajustar a busca ou os filtros."
                  : "Adicione usuários que já possuem cadastro no sistema informando o e-mail e a função."
              }
              action={
                activeFiltersCount > 0
                  ? { label: "Limpar filtros", onClick: clearFilters }
                  : {
                      label: "Convidar usuário",
                      onClick: () => setInviteOpen(true),
                    }
              }
              className="rounded-none border-0 bg-transparent shadow-none"
            />
          ) : (
            <TeamTable
              members={items}
              currentUserId={currentUser?.id}
              onEdit={(m) => setEditMember(m)}
              onDeactivate={(m) => setDeactivateMember(m)}
              onActivate={handleActivate}
              onRemove={(m) => setRemoveMember(m)}
              selectedIds={selectedIds}
              onSelect={handleSelectOne}
              onSelectAll={handleSelectAll}
            />
          )}

          {/* Pagination */}
          <Pagination
            pagination={pagination}
            onPageChange={goToPage}
            className="mt-0 rounded-none border-x-0 border-b-0"
          />
        </TableSurface>
      </div>

      <InviteUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => setInviteOpen(false)}
      />

      <EditTeamMemberDialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
        member={editMember}
        onSuccess={handleEditSuccess}
      />

      <Confirm
        open={!!deactivateMember}
        onClose={() => setDeactivateMember(null)}
        onConfirm={handleDeactivateConfirm}
        title="Desativar membro"
        message="Desativar este membro? Ele não poderá acessar a organização até ser reativado."
        confirmText="Desativar"
        variant="default"
        isLoading={confirmLoading}
      />

      <Confirm
        open={!!removeMember}
        onClose={() => setRemoveMember(null)}
        onConfirm={handleRemoveConfirm}
        title="Remover da equipe"
        message="Remover este membro da equipe? Ele não terá mais acesso a esta organização. O usuário não será excluído do sistema."
        confirmText="Sim, remover"
        variant="danger"
        isLoading={confirmLoading}
      />

      <Confirm
        open={bulkConfirm?.open ?? false}
        onClose={() => setBulkConfirm(null)}
        onConfirm={() => bulkConfirm?.onConfirm()}
        title={bulkConfirm?.title ?? ""}
        message={bulkConfirm?.message ?? ""}
        confirmText={bulkConfirm?.confirmText ?? "Confirmar"}
        variant={bulkConfirm?.variant ?? "default"}
        isLoading={bulkLoading}
      />
    </>
  );
}
