"use client";
import useSWR from "swr";
import { PageHeader } from "@/components/PageHeader";
import { RequirePermission, TableSurface } from "@/components";
import { PERMISSIONS } from "@/lib/permissions";
import { mutiraoDashboardApi } from "@/lib/api/mutirao-dashboard";

function Content() {
  const { data, error } = useSWR("mutirao-dashboard", async () => {
    const response = await mutiraoDashboardApi.overview();
    if (response.error) throw new Error(response.error);
    return response.data;
  });
  return (
    <>
      <PageHeader
        title="Dashboard do mutirão"
        description="Disponibilidade e resultados por clínica."
      />
      <TableSurface>
        <div className="overflow-x-auto p-4">
          {error ? (
            <p>Não foi possível carregar o dashboard.</p>
          ) : !data ? (
            <p>Carregando indicadores…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th>Clínica</th>
                  <th>Capacidade</th>
                  <th>Livres</th>
                  <th>Reservadas</th>
                  <th>Ocupadas</th>
                  <th>Confirmações</th>
                </tr>
              </thead>
              <tbody>
                {data.clinics.map((clinic) => (
                  <tr key={clinic.id}>
                    <td>{clinic.name}</td>
                    <td>{clinic.capacity}</td>
                    <td>{clinic.free_slots}</td>
                    <td>{clinic.reserved_slots}</td>
                    <td>{clinic.occupied_slots}</td>
                    <td>{clinic.confirmations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </TableSurface>
    </>
  );
}
export default function MutiraoDashboard() {
  return (
    <RequirePermission perm={PERMISSIONS.MUTIRAO_DASHBOARD}>
      <Content />
    </RequirePermission>
  );
}
