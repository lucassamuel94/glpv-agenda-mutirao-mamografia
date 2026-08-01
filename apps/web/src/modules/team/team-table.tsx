"use client";

import type { TeamMember } from "@/types/team";
import { DataTable, RowActionsMenu } from "@/components";
import type { RowActionsMenuAction } from "@/components";
import { Edit, UserMinus, Trash2, UserPlus } from "lucide-react";
import { Badge } from "@/components/Badge";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  COORDINATOR: "Coordenador",
  USER: "Usuário",
};

interface TeamTableProps {
  members: TeamMember[];
  isLoading?: boolean;
  currentUserId?: string | null;
  onEdit?: (member: TeamMember) => void;
  onDeactivate?: (member: TeamMember) => void;
  onActivate?: (member: TeamMember) => void;
  onRemove?: (member: TeamMember) => void;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

/**
 * Determina se um membro pode entrar em operações em massa.
 * Alinha o checkbox com as regras do backend (self, primary) — o admin vê
 * que o super_admin não pode ser desabilitado só após o submit.
 */
function canBulkSelect(
  member: TeamMember,
  currentUserId?: string | null,
): boolean {
  if (currentUserId != null && currentUserId === member.id) return false;
  if (member.is_primary === true) return false;
  return true;
}

export function TeamTable({
  members,
  isLoading,
  currentUserId,
  onEdit,
  onDeactivate,
  onActivate,
  onRemove,
  selectedIds = [],
  onSelect,
  onSelectAll,
}: TeamTableProps) {
  const selectable = members.filter((m) => canBulkSelect(m, currentUserId));
  const selectableIds = selectable.map((m) => m.id);
  const allSelected =
    selectable.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;
  const showSelection = Boolean(onSelect && selectable.length > 0);
  const totalCols = (showSelection ? 1 : 0) + 5;

  if (isLoading) {
    return (
      <DataTable.Root responsive="stack" className="rounded-none border-0">
        <DataTable.Header>
          <DataTable.HeaderRow>
            {onSelectAll && selectable.length > 0 && (
              <DataTable.SelectAllHeaderCell
                allSelected={false}
                someSelected={false}
                onToggle={() => {}}
                disabled
              />
            )}
            <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
            <DataTable.HeaderCell>E-mail</DataTable.HeaderCell>
            <DataTable.HeaderCell>Função</DataTable.HeaderCell>
            <DataTable.HeaderCell>Status</DataTable.HeaderCell>
            <DataTable.HeaderCell align="right">Ações</DataTable.HeaderCell>
          </DataTable.HeaderRow>
        </DataTable.Header>
        <DataTable.Body>
          <DataTable.SkeletonRow colSpan={totalCols} />
          <DataTable.SkeletonRow colSpan={totalCols} />
          <DataTable.SkeletonRow colSpan={totalCols} />
        </DataTable.Body>
      </DataTable.Root>
    );
  }

  return (
    <DataTable.Root responsive="stack" className="rounded-none border-0">
      <DataTable.Header>
        <DataTable.HeaderRow>
          {onSelectAll && selectable.length > 0 && (
            <DataTable.SelectAllHeaderCell
              allSelected={allSelected}
              someSelected={someSelected}
              onToggle={onSelectAll}
              disabled={selectable.length === 0}
            />
          )}
          <DataTable.HeaderCell>Nome</DataTable.HeaderCell>
          <DataTable.HeaderCell>E-mail</DataTable.HeaderCell>
          <DataTable.HeaderCell>Função</DataTable.HeaderCell>
          <DataTable.HeaderCell>Status</DataTable.HeaderCell>
          <DataTable.HeaderCell align="right">Ações</DataTable.HeaderCell>
        </DataTable.HeaderRow>
      </DataTable.Header>
      <DataTable.Body>
        {members.map((member) => {
          const isCurrentUser =
            currentUserId != null && currentUserId === member.id;
          const isPrimary = member.is_primary === true;
          const isActive = member.is_active !== false;
          const canDeactivateOrRemove = !isCurrentUser && !isPrimary;
          const canSelect = canBulkSelect(member, currentUserId);
          const isSelected = selectedIds.includes(member.id);

          return (
            <DataTable.Row key={member.id} selected={isSelected}>
              {showSelection && (
                <DataTable.SelectCell
                  selected={isSelected}
                  onToggle={() => canSelect && onSelect?.(member.id)}
                  disabled={!canSelect}
                  ariaLabel={
                    isCurrentUser
                      ? "Você não pode se selecionar"
                      : isPrimary
                        ? "Conta principal não pode ser selecionada"
                        : `Selecionar ${member.name}`
                  }
                  className="max-md:hidden"
                />
              )}
              <DataTable.Cell
                mobileLabel="Nome"
                mobileSpan="full"
                className="font-medium"
              >
                {member.name}
                {member.is_primary && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (principal)
                  </span>
                )}
              </DataTable.Cell>
              <DataTable.Cell
                mobileLabel="E-mail"
                className="text-muted-foreground"
              >
                {member.email}
              </DataTable.Cell>
              <DataTable.Cell mobileLabel="Função">
                {ROLE_LABELS[member.role] ?? member.role}
              </DataTable.Cell>
              <DataTable.Cell mobileLabel="Status">
                <Badge variant={isActive ? "success" : "neutral"}>
                  {isActive ? "Ativo" : "Inativo"}
                </Badge>
              </DataTable.Cell>
              <DataTable.Cell mobileLabel="Ações" align="right">
                <div
                  className="flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <RowActionsMenu
                    actions={[
                      ...(onEdit
                        ? [
                            {
                              icon: Edit,
                              label: "Editar",
                              onClick: () => onEdit(member),
                              separatorAfter: canDeactivateOrRemove,
                            } satisfies RowActionsMenuAction,
                          ]
                        : []),
                      ...(canDeactivateOrRemove && isActive && onDeactivate
                        ? [
                            {
                              icon: UserMinus,
                              label: "Desativar",
                              onClick: () => onDeactivate(member),
                            } satisfies RowActionsMenuAction,
                          ]
                        : []),
                      ...(canDeactivateOrRemove && !isActive && onActivate
                        ? [
                            {
                              icon: UserPlus,
                              label: "Ativar",
                              onClick: () => onActivate(member),
                            } satisfies RowActionsMenuAction,
                          ]
                        : []),
                      ...(canDeactivateOrRemove && onRemove
                        ? [
                            {
                              icon: Trash2,
                              label: "Excluir",
                              onClick: () => onRemove(member),
                              variant: "danger",
                            } satisfies RowActionsMenuAction,
                          ]
                        : []),
                    ]}
                  />
                </div>
              </DataTable.Cell>
            </DataTable.Row>
          );
        })}
      </DataTable.Body>
    </DataTable.Root>
  );
}
