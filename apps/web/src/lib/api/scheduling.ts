import { ApiService, type ApiResponse } from "./base";

export type SlotStatus = "LIVRE" | "RESERVADA" | "OCUPADA";

/** Turno da vaga. Corte às 12h no horário de parede de São Paulo (RN-60). */
export type SlotPeriod = "MANHA" | "TARDE";

export type Slot = {
  id: string;
  clinic_id: string;
  slot_at: string;
  status: SlotStatus;
};

export type Appointment = {
  id: string;
  patient_id: string;
  slot_id: string;
  protocol: string;
  status: "CONFIRMADO" | "CANCELADO";
  channel: "BOT" | "PAINEL";
  cancel_reason: string | null;
  canceled_at: string | null;
  created_at: string;
};

/** Carga de uma clínica na fila de equilíbrio — `recommended` usa a regra do bot. */
export type ClinicBalance = {
  clinicId: string;
  name: string;
  capacity: number;
  free: number;
  reserved: number;
  occupied: number;
  occupationRate: number;
  recommended: boolean;
};

export type AvailabilityDay = {
  day: string;
  free: number;
  reserved: number;
  occupied: number;
  byClinic: Array<{
    clinicId: string;
    free: number;
    reserved: number;
    occupied: number;
  }>;
};

export type Availability = {
  from: string;
  to: string;
  days: AvailabilityDay[];
  clinics: ClinicBalance[];
};

export type SuggestionReason = "EARLIEST" | "BALANCE" | "ALTERNATIVE";

export type SlotSuggestion = {
  slotId: string;
  slotAt: string;
  clinicId: string;
  clinicName: string;
  reason: SuggestionReason;
};

export type SlotHold = { slotId: string; reservedUntil: string };

class SchedulingApi extends ApiService {
  slots(clinicId: string, date: string): Promise<ApiResponse<Slot[]>> {
    const query = new URLSearchParams({ clinicId, date }).toString();
    return this.get(`/scheduling/slots?${query}`);
  }

  /**
   * Disponibilidade do intervalo inteiro em UMA chamada — é o que permite o
   * calendário de densidade sem uma requisição por clínica/dia.
   */
  availability(params: {
    from: string;
    to: string;
    clinicId?: string;
    period?: SlotPeriod;
  }): Promise<ApiResponse<Availability>> {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.clinicId) query.set("clinicId", params.clinicId);
    if (params.period) query.set("period", params.period);
    return this.get(`/scheduling/availability?${query.toString()}`);
  }

  /** Melhores encaixes: mais próxima, melhor equilíbrio e alternativas. */
  suggest(params: {
    from: string;
    to: string;
    period?: SlotPeriod;
    limit?: number;
  }): Promise<ApiResponse<SlotSuggestion[]>> {
    const query = new URLSearchParams({ from: params.from, to: params.to });
    if (params.period) query.set("period", params.period);
    if (params.limit) query.set("limit", String(params.limit));
    return this.get(`/scheduling/suggest?${query.toString()}`);
  }

  /** Segura a vaga enquanto a operadora preenche o formulário. */
  hold(slotId: string): Promise<ApiResponse<SlotHold>> {
    return this.post("/scheduling/hold", { slotId });
  }

  releaseHold(slotId: string): Promise<ApiResponse<{ released: boolean }>> {
    return this.post("/scheduling/hold/release", { slotId });
  }

  manualBooking(payload: {
    slotId: string;
    patientId: string;
    birthDate: string;
    hasMammographyWithin12Months: boolean;
  }): Promise<ApiResponse<Appointment>> {
    return this.post("/scheduling/manual-booking", payload);
  }
}

export const schedulingApi = new SchedulingApi();
