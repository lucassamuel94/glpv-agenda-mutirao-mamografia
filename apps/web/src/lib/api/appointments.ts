import { ApiService, type ApiResponse } from "./base";
import type { Appointment } from "./scheduling";

export type CancellationReason = "ERRO_OPERACIONAL" | "DESISTENCIA" | "AUSENCIA_CONFIRMADA";

class AppointmentsApi extends ApiService {
  history(patientId: string): Promise<ApiResponse<Appointment[]>> {
    return this.get(`/appointments/patient/${patientId}`);
  }

  cancel(id: string, reason: CancellationReason): Promise<ApiResponse<Appointment>> {
    return this.post(`/appointments/${id}/cancel`, { reason });
  }
}

export const appointmentsApi = new AppointmentsApi();
