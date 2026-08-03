"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RequirePermission, TableSurface, ActionBar } from "@/components";
import { Button } from "@/components/Button";
import { PERMISSIONS } from "@/lib/permissions";
import { useWaitingList } from "@/hooks/use-waiting-list";
import { formatDateOnlyPtBR, formatDateTimeOnlyPtBR } from "@/lib/formatters";
import { toast } from "@/lib/toast";
import { AddWaitingListDialog } from "@/modules/waiting-list/add-waiting-list-dialog";
import { EmptyState } from "@/modules/common/empty-state";

function Content() {
  const { data, isLoading, markContactedAction, removeAction } = useWaitingList();
  const items = useMemo(() => data || [], [data]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleMarkContacted = async (id: string) => {
    try {
      await markContactedAction(id);
      toast("Marcada como contatada.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao marcar contato.", "error");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeAction(id);
      toast("Removida da lista de espera.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao remover.", "error");
    }
  };

  return (
    <>
      <PageHeader
        title="Lista de espera"
        description="RN-43..46 — ordenada pela data de entrada mais antiga."
        actions={
          <ActionBar>
            <Button variant="primary" size="md" onClick={() => setDialogOpen(true)}>
              Adicionar
            </Button>
          </ActionBar>
        }
      />
      <TableSurface>
        <div className="overflow-x-auto p-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : items.length === 0 ? (
            <EmptyState
              kind="waiting-list"
              mode="no-data"
              compact
              title="Lista de espera vazia"
              description="Adicione uma paciente para acompanhar a próxima oportunidade."
              action={{ label: "Adicionar", onClick: () => setDialogOpen(true) }}
              className="border-0 bg-transparent shadow-none"
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Nome</th>
                  <th>Nascimento</th>
                  <th>Telefone</th>
                  <th>Entrada</th>
                  <th>Contatada em</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => (
                  <tr key={entry.id} className="border-t border-border">
                    <td className="py-2">{entry.full_name}</td>
                    <td>{formatDateOnlyPtBR(entry.birth_date)}</td>
                    <td>{entry.phone}</td>
                    <td>{formatDateTimeOnlyPtBR(entry.entered_at)}</td>
                    <td>{entry.contacted_at ? formatDateTimeOnlyPtBR(entry.contacted_at) : "—"}</td>
                    <td className="py-2 text-right space-x-3">
                      {!entry.contacted_at && (
                        <button
                          type="button"
                          onClick={() => handleMarkContacted(entry.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          Marcar contatada
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(entry.id)}
                        className="text-sm text-destructive hover:underline"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </TableSurface>
      <AddWaitingListDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

export default function WaitingList() {
  return (
    <RequirePermission perm={PERMISSIONS.LISTA_ESPERA}>
      <Content />
    </RequirePermission>
  );
}
