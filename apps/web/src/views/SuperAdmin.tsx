"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import {
  Edit,
  Trash2,
  Plus,
  Building2,
  UsersRound,
} from "lucide-react";
import { superAdminApi } from "@/lib/api/super-admin";
import { authApi } from "@/lib/api/auth";
import { toast } from "@/lib/toast";
import { DataTable } from "@/components/DataTable";
import { cn } from "@/lib/utils";
import { SkeletonFullPage } from "@/modules/common/skeleton";
import { ErrorMessage } from "@/modules/common/error-message";
import { EmptyState } from "@/modules/common/empty-state";
import { CreateSaUserDialog } from "@/modules/super-admin/create-sa-user-dialog";
import { CreateOrganizationDialog } from "@/modules/super-admin/create-organization-dialog";
import { EditOrganizationDialog } from "@/modules/super-admin/edit-organization-dialog";
import { EditSaUserDialog } from "@/modules/super-admin/edit-sa-user-dialog";
import { Confirm } from "@/components/Dialog";
import {
  Tabs,
  InputSearch,
  TableSurface,
  Tooltip,
} from "@/components";
import { useAuth } from "@/hooks/use-auth";
import { useSaOrganizations } from "@/hooks/use-sa-organizations";
import Pagination from "@/components/Pagination";
import { useSocket } from "@/contexts/socket-context";
import type { SaUserListItem, SaDashboardStats } from "@/lib/api/super-admin";
import {
  getSaRoleLabel,
  PAINEL_NAME,
  USUARIOS_PLATAFORMA_LABEL,
} from "@/modules/super-admin/sa-display-labels";

const STATUS_DOT_CLASSES: Record<string, string> = {
  ACTIVATION: "bg-amber-500",
  ACTIVE: "bg-emerald-500",
  SUSPENDED: "bg-muted-foreground",
  CANCELLED: "bg-red-500",
};

export default function SuperAdminPage({
  initialTab = "organizations",
}: {
  initialTab?: "organizations" | "users";
}) {
  const [stats, setStats] = useState<SaDashboardStats | null>(null);
  const [saUsers, setSaUsers] = useState<SaUserListItem[] | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createOrganizationDialogOpen, setCreateOrganizationDialogOpen] =
    useState(false);
  const [editOrganizationId, setEditOrganizationId] = useState<string | null>(
    null,
  );
  const [editUser, setEditUser] = useState<SaUserListItem | null>(null);
  const [deleteOrganizationId, setDeleteOrganizationId] = useState<
    string | null
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"organizations" | "users">(
    initialTab === "users" ? "users" : "organizations",
  );
  const [userQuery, setUserQuery] = useState("");
  // Conexões WebSocket ao vivo. Não vive junto dos dados da listagem porque
  // esses vêm do SWR (`useSaOrganizations`): mutar o cache a cada evento de
  // conexão brigaria com a revalidação. Aqui é só um mapa sobreposto no
  // render, que continua correto com a lista paginada.
  const [liveConnections, setLiveConnections] = useState<
    Record<string, number>
  >({});
  const { user: currentUser, hasRole } = useAuth();
  const canDeleteOrganization = hasRole("SA_MASTER");
  const canCreateOrganization = hasRole("SA_MASTER") || hasRole("SA_USER");
  const { socket } = useSocket();

  const ORGANIZATION_STATUSES = [
    { value: "ACTIVATION", label: "Ativação" },
    { value: "ACTIVE", label: "Ativa" },
    { value: "SUSPENDED", label: "Suspensa" },
    { value: "CANCELLED", label: "Cancelada" },
  ] as const;

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    const res = await superAdminApi.getStats();
    if (res.data) setStats(res.data);
    if (res.error) setError(res.error);
    setLoadingStats(false);
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const res = await superAdminApi.listUsers();
    if (res.data) setSaUsers(res.data);
    if (res.error) setError(res.error);
    setLoadingUsers(false);
  }, []);

  // Busca de dados em efeito — uso legítimo; ver a nota igual em AdminAudit.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data: {
      connectionsByOrganization: Record<string, number>;
    }) => {
      setLiveConnections(data.connectionsByOrganization ?? {});
    };
    socket.on("organization-connections-changed", handler);
    return () => {
      socket.off("organization-connections-changed", handler);
    };
  }, [socket]);

  // Lista da tabela: filtro/ordem/página resolvidos no backend e refletidos na
  // URL (mesmo padrão de useReports/useTeam).
  const {
    data: organizationsData,
    pagination: organizationsPagination,
    isLoading: loadingOrganizations,
    error: organizationsError,
    filters: organizationFilters,
    sorts: organizationSorts,
    applyFilters: applyOrganizationFilters,
    applySort: applyOrganizationSort,
    goToPage: goToOrganizationsPage,
    invalidateAll: refetchOrganizations,
  } = useSaOrganizations();

  const items = useMemo(() => organizationsData || [], [organizationsData]);

  const filteredUsers = useMemo(() => {
    const users = saUsers ?? [];
    const query = userQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  }, [saUsers, userQuery]);

  const isAnyDialogOpen =
    createDialogOpen ||
    createOrganizationDialogOpen ||
    !!editOrganizationId ||
    !!editUser ||
    !!deleteOrganizationId;

  // Atalho "N" (sem modificador) — abre a criação do que estiver na aba
  // ativa, igual "c"/"n" em Linear/Github. Ignorado enquanto o usuário
  // digita em qualquer campo ou já existe um diálogo aberto.
  useEffect(() => {
    if (!canCreateOrganization) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isAnyDialogOpen) return;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable);
      if (isTyping) return;
      e.preventDefault();
      if (activeTab === "organizations") {
        setCreateOrganizationDialogOpen(true);
      } else {
        setCreateDialogOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, canCreateOrganization, isAnyDialogOpen]);

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    loadUsers();
    toast("Usuário SA criado com sucesso.", "success");
  };

  const handleEditSuccess = () => {
    setEditUser(null);
    loadUsers();
    toast("Usuário SA atualizado com sucesso.", "success");
  };

  const handleDeleteOrganizationConfirm = async () => {
    if (!deleteOrganizationId) return;
    setConfirmLoading(true);
    try {
      const res = await superAdminApi.deleteOrganization(deleteOrganizationId);
      if (res.error) {
        toast(res.error, "error");
        return;
      }
      setDeleteOrganizationId(null);
      loadStats();
      refetchOrganizations();
      toast("Organização excluída com sucesso.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erro ao excluir organização.",
        "error",
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  /**
   * Travessia console → CRM (spec 2026-07-28): troca o contexto para a org e
   * LEVA o SA para o CRM dela. A ação antiga ("Ver como esta organização")
   * trocava o contexto e deixava o usuário parado no console — o meio-caminho
   * que motivou a separação de mundos. O caminho de volta é o SaOrgBanner.
   *
   * IMPORTANTE: API direto, SEM passar pelo estado do React (switchOrganization
   * do useAuth seta isLoading → RequireAuth desmonta o console → o
   * PlatformGate remonta zerado e re-adquire a Platform, desfazendo a
   * travessia — medido pela sequência de rede em 2026-07-28: POST
   * switch-organization(org) 200 → GET check 200 → POST
   * switch-organization(Platform) 200 de novo, o remount reagindo antes da
   * navegação assentar). O token novo é salvo pelo próprio authApi; o full
   * reload re-hidrata a sessão já na organização.
   */
  const handleEnterOrganization = async (
    organizationId: string,
    organizationName: string,
  ) => {
    try {
      const response = await authApi.switchOrganization(organizationId);
      if (response.error || !response.data?.access_token) {
        toast(response.error ?? "Erro ao entrar na organização", "error");
        return;
      }
      window.location.assign("/");
    } catch {
      toast(`Erro ao entrar na organização ${organizationName}.`, "error");
    }
  };

  const isInitialLoading = loadingStats && loadingUsers;

  const fatalError = error ?? organizationsError;
  if (fatalError && !stats && !saUsers && !items.length) {
    return (
      <>
        <PageHeader title={PAINEL_NAME} />
        <ErrorMessage error={fatalError} />
      </>
    );
  }

  if (isInitialLoading) {
    return (
      <>
        <PageHeader title={PAINEL_NAME} isLoading />
        <SkeletonFullPage length={6} variant="list" />
      </>
    );
  }

  const totalOrganizations = stats?.totalOrganizations ?? 0;
  const totalUsers = saUsers?.length ?? 0;

  return (
    <>
      <PageHeader
        title={PAINEL_NAME}
        description={`${totalOrganizations} organizaç${totalOrganizations === 1 ? "ão" : "ões"} · ${totalUsers} ${
          totalUsers === 1
            ? USUARIOS_PLATAFORMA_LABEL.toLowerCase().replace(
                /^usuários/,
                "usuário",
              )
            : USUARIOS_PLATAFORMA_LABEL.toLowerCase()
        }`}
      />
      <Tabs
        variant="solid"
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value === "users" ? "users" : "organizations")
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs.List>
            <Tabs.Trigger value="organizations">
              <Building2 size={15} aria-hidden="true" />
              Organizações
            </Tabs.Trigger>
            <Tabs.Trigger value="users">
              <UsersRound size={15} aria-hidden="true" />
              Equipe da plataforma
            </Tabs.Trigger>
          </Tabs.List>
          {activeTab === "organizations" && canCreateOrganization && (
            <Tooltip content="Atalho: N">
              <Button
                onClick={() => setCreateOrganizationDialogOpen(true)}
                variant="primary"
                className="gap-1.5"
              >
                <Plus size={16} />
                Nova organização
              </Button>
            </Tooltip>
          )}
          {activeTab === "users" && canCreateOrganization && (
            <Tooltip content="Atalho: N">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="primary"
                className="gap-1.5"
              >
                <Plus size={16} />
                Novo usuário
              </Button>
            </Tooltip>
          )}
        </div>

        <Tabs.Content value="organizations" className="mt-4">
          <TableSurface>
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <InputSearch
                name="org-search"
                variant="input"
                placeholder="Buscar por nome ou CNPJ"
                value={(organizationFilters.search as string) ?? ""}
                onSearch={(search) =>
                  applyOrganizationFilters({
                    search: search.trim() || undefined,
                  })
                }
              />
            </div>
            <DataTable.Root variant="bare">
              <DataTable.Header className="bg-secondary">
                {/* Só recebem `sortable` as colunas que o backend sabe
                    ordenar (allowlist em OrganizationRepository). Usuários e
                    Conexões ativas ficam de fora de propósito: são agregado e
                    estado em memória do WebSocket — marcá-las daria um
                    cabeçalho clicável que não muda a ordem. */}
                <DataTable.HeaderRow>
                  <DataTable.HeaderCell
                    sortable
                    sortKey="name"
                    currentSort={organizationSorts}
                    onSort={applyOrganizationSort}
                  >
                    Organização
                  </DataTable.HeaderCell>
                  <DataTable.HeaderCell align="right">
                    Usuários
                  </DataTable.HeaderCell>
                  <DataTable.HeaderCell align="right">
                    Conexões ativas
                  </DataTable.HeaderCell>
                  <DataTable.HeaderCell
                    sortable
                    sortKey="status"
                    currentSort={organizationSorts}
                    onSort={applyOrganizationSort}
                  >
                    Status
                  </DataTable.HeaderCell>
                  <DataTable.HeaderCell>Criado por</DataTable.HeaderCell>
                  <DataTable.HeaderCell
                    sortable
                    sortKey="created_at"
                    currentSort={organizationSorts}
                    onSort={applyOrganizationSort}
                  >
                    Criado em
                  </DataTable.HeaderCell>
                  <DataTable.HeaderCell className="w-10" />
                </DataTable.HeaderRow>
              </DataTable.Header>
              <DataTable.Body>
                {loadingOrganizations ? (
                  <DataTable.SkeletonRow colSpan={7} />
                ) : !items.length ? (
                  <tr>
                    <td colSpan={7} className="p-0">
                      <EmptyState
                        kind="organizations"
                        mode={organizationFilters.search ? "no-results" : "no-data"}
                        compact
                        query={(organizationFilters.search as string) ?? ""}
                        title={organizationFilters.search ? "Nenhuma organização encontrada" : "Nenhuma organização cadastrada"}
                        description={organizationFilters.search ? "Tente ajustar a busca ou limpar o filtro." : "Cadastre a primeira organização para começar."}
                        action={
                          organizationFilters.search
                            ? {
                                label: "Limpar busca",
                                onClick: () => applyOrganizationFilters({ search: undefined }),
                              }
                            : canCreateOrganization
                              ? { label: "Nova organização", onClick: () => setCreateOrganizationDialogOpen(true) }
                              : undefined
                        }
                        className="border-0 bg-transparent shadow-none"
                      />
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <DataTable.Row
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => handleEnterOrganization(c.id, c.name)}
                    >
                      <DataTable.Cell className="font-medium">{c.name}</DataTable.Cell>
                      <DataTable.Cell
                        align="right"
                        className={cn(
                          "tabular-nums",
                          !c.userCount && "text-muted-foreground",
                        )}
                      >
                        {c.userCount}
                      </DataTable.Cell>
                      <DataTable.Cell
                        align="right"
                        className={cn(
                          "tabular-nums",
                          !(liveConnections[c.id] ?? c.activeConnections) &&
                            "text-muted-foreground",
                        )}
                      >
                        {liveConnections[c.id] ?? c.activeConnections ?? 0}
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            c.status === "ACTIVE" && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
                            c.status === "ACTIVATION" && "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                            c.status === "SUSPENDED" && "bg-muted text-muted-foreground",
                            c.status === "CANCELLED" && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              STATUS_DOT_CLASSES[c.status] ?? "bg-muted-foreground",
                            )}
                          />
                          {ORGANIZATION_STATUSES.find(
                            (s) => s.value === c.status,
                          )?.label ?? c.status}
                        </span>
                      </DataTable.Cell>
                      <DataTable.Cell>
                        {c.createdByName ? (
                          <Tooltip content={c.createdByEmail || ""}>
                            <span className="truncate max-w-[120px] inline-block align-bottom">
                              {c.createdByName}
                            </span>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </DataTable.Cell>
                      <DataTable.Cell className="text-muted-foreground text-xs">
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </DataTable.Cell>
                      <DataTable.Cell>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canCreateOrganization && (
                            <Tooltip content="Editar organização">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() => setEditOrganizationId(c.id)}
                              >
                                <Edit size={15} />
                              </Button>
                            </Tooltip>
                          )}
                          {canDeleteOrganization && (
                            <Tooltip content="Excluir organização">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeleteOrganizationId(c.id)}
                              >
                                <Trash2 size={15} />
                              </Button>
                            </Tooltip>
                          )}
                        </div>
                      </DataTable.Cell>
                    </DataTable.Row>
                  ))
                )}
              </DataTable.Body>
            </DataTable.Root>
            <Pagination
              pagination={organizationsPagination}
              isLoading={loadingOrganizations}
              onPageChange={goToOrganizationsPage}
              className="mt-0 rounded-none border-x-0 border-b-0"
            />
          </TableSurface>
        </Tabs.Content>

        <Tabs.Content value="users" className="mt-4">
          <TableSurface>
            <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
              <InputSearch
                name="user-search"
                variant="input"
                showSearchButton={false}
                placeholder="Buscar por nome ou e-mail"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
              />
            </div>
            <DataTable.Root variant="bare">
              <DataTable.Header className="bg-secondary">
                <DataTable.HeaderRow>
                  <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
                  <DataTable.HeaderCell>E-mail</DataTable.HeaderCell>
                  <DataTable.HeaderCell>Função</DataTable.HeaderCell>
                  <DataTable.HeaderCell>Status</DataTable.HeaderCell>
                  <DataTable.HeaderCell>Criado em</DataTable.HeaderCell>
                </DataTable.HeaderRow>
              </DataTable.Header>
              <DataTable.Body>
                {loadingUsers ? (
                  <DataTable.SkeletonRow colSpan={5} />
                ) : !filteredUsers.length ? (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <EmptyState
                        kind="users"
                        mode={userQuery ? "no-results" : "no-data"}
                        compact
                        query={userQuery}
                        title={userQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                        description={userQuery ? "Tente ajustar a busca ou limpar o termo informado." : "Cadastre o primeiro usuário da plataforma para começar."}
                        action={
                          userQuery
                            ? { label: "Limpar busca", onClick: () => setUserQuery("") }
                            : { label: "Novo usuário", onClick: () => setCreateDialogOpen(true) }
                        }
                        className="border-0 bg-transparent shadow-none"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isActive = u.is_active !== false;
                    return (
                      <DataTable.Row
                        key={u.id}
                        className="cursor-pointer"
                        onClick={() => setEditUser(u)}
                      >
                        <DataTable.Cell className="font-medium">{u.name}</DataTable.Cell>
                        <DataTable.Cell>{u.email}</DataTable.Cell>
                        <DataTable.Cell>
                          <span className="font-medium">
                            {getSaRoleLabel(u.super_admin_role)}
                          </span>
                        </DataTable.Cell>
                        <DataTable.Cell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              isActive
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                isActive ? "bg-emerald-500" : "bg-muted-foreground",
                              )}
                            />
                            {isActive ? "Ativo" : "Inativo"}
                          </span>
                        </DataTable.Cell>
                        <DataTable.Cell className="text-muted-foreground text-xs">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString(
                                "pt-BR",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </DataTable.Cell>
                      </DataTable.Row>
                    );
                  })
                )}
              </DataTable.Body>
            </DataTable.Root>
          </TableSurface>
        </Tabs.Content>

      </Tabs>

      <CreateSaUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <CreateOrganizationDialog
        open={createOrganizationDialogOpen}
        onOpenChange={setCreateOrganizationDialogOpen}
        onSuccess={() => {
          loadStats();
          refetchOrganizations();
        }}
      />

      <EditOrganizationDialog
        open={!!editOrganizationId}
        onOpenChange={(open) => !open && setEditOrganizationId(null)}
        organizationId={editOrganizationId}
        onSuccess={() => {
          loadStats();
          refetchOrganizations();
        }}
      />

      <EditSaUserDialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
        user={editUser}
        currentUserId={currentUser?.id}
        onSuccess={handleEditSuccess}
        onDeactivate={async (userId) => {
          const res = await superAdminApi.deactivateUser(userId);
          if (res.error) { toast(res.error, "error"); throw new Error(res.error); }
          loadUsers();
          toast("Usuário SA desativado com sucesso.", "success");
        }}
        onActivate={async (userId) => {
          const res = await superAdminApi.activateUser(userId);
          if (res.error) { toast(res.error, "error"); throw new Error(res.error); }
          loadUsers();
          toast("Usuário SA ativado com sucesso.", "success");
        }}
        onDelete={async (userId) => {
          const res = await superAdminApi.deleteUser(userId);
          if (res.error) { toast(res.error, "error"); throw new Error(res.error); }
          loadUsers();
          toast("Usuário SA excluído com sucesso.", "success");
        }}
      />

      <Confirm
        open={!!deleteOrganizationId}
        onClose={() => setDeleteOrganizationId(null)}
        onConfirm={handleDeleteOrganizationConfirm}
        title="Excluir organização"
        message={`Excluir esta organização? Não é possível excluir organizações com ${USUARIOS_PLATAFORMA_LABEL} vinculados. Esta ação não pode ser desfeita.`}
        confirmText="Sim, excluir"
        variant="danger"
        isLoading={confirmLoading}
      />
    </>
  );
}
