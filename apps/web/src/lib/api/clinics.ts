import { ApiService, type ApiResponse } from "./base";

export type Clinic = {
  id: string;
  name: string;
  capacity: number;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  active: boolean;
};

class ClinicsApi extends ApiService {
  list(): Promise<ApiResponse<Clinic[]>> {
    return this.get("/clinics");
  }
}

export const clinicsApi = new ClinicsApi();
