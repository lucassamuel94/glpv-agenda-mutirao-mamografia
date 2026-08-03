import { ApiService, type ApiResponse } from "./base";

export type Patient = {
  id: string;
  full_name: string;
  birth_date: string;
  phone: string;
  alt_phone: string | null;
  bot_blocked: boolean;
};

class PatientsApi extends ApiService {
  search(term: string): Promise<ApiResponse<Patient[]>> {
    return this.post("/patients/search", { term });
  }

  findOrCreate(payload: {
    fullName: string;
    birthDate: string;
    phone: string;
    altPhone?: string;
  }): Promise<ApiResponse<Patient>> {
    return this.post("/patients", payload);
  }
}

export const patientsApi = new PatientsApi();
