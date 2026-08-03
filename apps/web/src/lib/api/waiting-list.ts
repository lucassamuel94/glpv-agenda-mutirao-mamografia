import { ApiService, type ApiResponse } from "./base";

export type WaitingListEntry = {
  id: string;
  patient_id: string;
  full_name: string;
  birth_date: string;
  phone: string;
  alt_phone: string | null;
  entered_at: string;
  contacted_at: string | null;
  removed_at: string | null;
  notes: string | null;
};

class WaitingListApi extends ApiService {
  list(): Promise<ApiResponse<WaitingListEntry[]>> {
    return this.get("/waiting-list");
  }

  create(payload: {
    patient_id: string;
    phone: string;
    alt_phone?: string;
    notes?: string;
  }): Promise<ApiResponse<WaitingListEntry>> {
    return this.post("/waiting-list", payload);
  }

  markContacted(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.patch(`/waiting-list/${id}/contacted`, {});
  }

  remove(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.delete(`/waiting-list/${id}`);
  }
}

export const waitingListApi = new WaitingListApi();
