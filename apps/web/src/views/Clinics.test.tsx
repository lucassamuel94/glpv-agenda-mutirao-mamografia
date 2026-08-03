import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ClinicsPage from "./Clinics";

const { getStats, listClinics } = vi.hoisted(() => ({
  getStats: vi.fn(),
  listClinics: vi.fn(),
}));

vi.mock("@/lib/api/super-admin", () => ({
  superAdminApi: { getStats, listClinics },
}));

vi.mock("@/lib/toast", () => ({ toast: vi.fn() }));

vi.mock("@/modules/super-admin/create-clinic-dialog", () => ({
  CreateClinicDialog: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button type="button" onClick={onSuccess}>Simular cadastro</button>
  ),
}));

describe("ClinicsPage", () => {
  it("atualiza a listagem depois do cadastro", async () => {
    const organization = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Grupo Luta Pela Vida",
    };
    const clinic = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Clínica E2E",
      capacity: 100,
      address: "Rua Teste, 100",
      phone: null,
      whatsapp: "5511999999999",
      active: true,
    };
    getStats.mockResolvedValue({ data: { organizations: [organization] } });
    listClinics.mockResolvedValueOnce({ data: [] }).mockResolvedValue({ data: [clinic] });

    render(<ClinicsPage />);

    await waitFor(() => expect(screen.getByText("Nenhuma clínica cadastrada")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Simular cadastro" }));

    await waitFor(() => expect(screen.getByText("Clínica E2E")).toBeInTheDocument());
    expect(screen.getByText("Rua Teste, 100")).toBeInTheDocument();
    expect(listClinics).toHaveBeenCalledTimes(2);
  });
});
