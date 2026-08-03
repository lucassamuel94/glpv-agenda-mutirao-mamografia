"use client";

import { useCallback, useEffect, useState } from "react";
import { Edit, Hospital, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { Confirm } from "@/components/Dialog";
import { TableSurface, Tooltip } from "@/components";
import { superAdminApi, type SaDashboardStats } from "@/lib/api/super-admin";
import type { Clinic } from "@/lib/api/clinics";
import { CreateClinicDialog } from "@/modules/super-admin/create-clinic-dialog";
import { EditClinicDialog } from "@/modules/super-admin/edit-clinic-dialog";
import { toast } from "@/lib/toast";

export default function ClinicsPage() {
  const [stats, setStats] = useState<SaDashboardStats | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [isLoadingClinics, setIsLoadingClinics] = useState(true);
  const [editingClinic, setEditingClinic] = useState<Clinic | null>(null);
  const [deletingClinic, setDeletingClinic] = useState<Clinic | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStats = useCallback(async () => {
    const response = await superAdminApi.getStats();
    if (response.data) setStats(response.data);
    if (response.error) toast(response.error, "error");
  }, []);

  const loadClinics = useCallback(async () => {
    setIsLoadingClinics(true);
    const statsResponse = await superAdminApi.getStats();
    const organization = statsResponse.data?.organizations.find(
      (item) => item.name === "Grupo Luta Pela Vida",
    );
    if (!organization) {
      setClinics([]);
      setIsLoadingClinics(false);
      return;
    }
    const response = await superAdminApi.listClinics(organization.id);
    if (response.data) setClinics(response.data);
    if (response.error) toast(response.error, "error");
    setIsLoadingClinics(false);
  }, []);

  const handleDelete = async () => {
    if (!deletingClinic) return;
    setIsDeleting(true);
    try {
      const response = await superAdminApi.deleteClinic(deletingClinic.id);
      if (response.error) {
        toast(response.error, "error");
        return;
      }
      setDeletingClinic(null);
      await loadClinics();
      toast("Clínica removida com sucesso.", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Erro ao remover clínica.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats();
    loadClinics();
  }, [loadClinics, loadStats]);

  return (
    <>
      <PageHeader
        title="Clínicas"
        description="Cadastre as unidades do Grupo Luta Pela Vida para o Mutirão de Mamografia 2026."
        actions={
          <Button onClick={() => setIsDialogOpen(true)} className="gap-1.5">
            <Plus size={16} aria-hidden="true" />
            Nova clínica
          </Button>
        }
      />

      <TableSurface>
        {isLoadingClinics ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">Carregando clínicas...</div>
        ) : clinics.length === 0 ? (
          <div className="animate-empty-state-enter flex min-h-64 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <Hospital size={24} className="text-muted-foreground" aria-hidden="true" />
            <p className="font-medium">Nenhuma clínica cadastrada</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Esta área é exclusiva para Super Admin e está vinculada à organização Grupo Luta Pela Vida.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Clínica</th>
                <th className="px-4 py-3 font-medium">Capacidade</th>
                <th className="px-4 py-3 font-medium">Endereço</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clinics.map((clinic) => (
                <tr key={clinic.id}>
                  <td className="px-4 py-3 font-medium">{clinic.name}</td>
                  <td className="px-4 py-3">{clinic.capacity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{clinic.address}</td>
                  <td className="px-4 py-3 text-muted-foreground">{clinic.whatsapp || clinic.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Tooltip content="Editar clínica">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingClinic(clinic)}
                        >
                          <Edit size={15} aria-hidden="true" />
                          <span className="sr-only">Editar {clinic.name}</span>
                        </Button>
                      </Tooltip>
                      <Tooltip content="Remover clínica">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingClinic(clinic)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                          <span className="sr-only">Remover {clinic.name}</span>
                        </Button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableSurface>

      <CreateClinicDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        organizations={stats?.organizations ?? []}
        onSuccess={() => {
          loadStats();
          loadClinics();
        }}
      />

      <EditClinicDialog
        clinic={editingClinic}
        open={!!editingClinic}
        onOpenChange={(open) => !open && setEditingClinic(null)}
        onSuccess={loadClinics}
      />

      <Confirm
        open={!!deletingClinic}
        onClose={() => setDeletingClinic(null)}
        onConfirm={handleDelete}
        title="Remover clínica"
        message={`Remover a clínica ${deletingClinic?.name ?? " selecionada"}? Os dados históricos serão preservados e a unidade deixará de aparecer na agenda.`}
        confirmText="Sim, remover"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
