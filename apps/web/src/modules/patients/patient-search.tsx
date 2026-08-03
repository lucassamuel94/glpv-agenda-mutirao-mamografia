"use client";

import { useState } from "react";
import InputSearch from "@/components/InputSearch";
import { patientsApi, type Patient } from "@/lib/api/patients";
import { toast } from "@/lib/toast";

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
}

/** RN-58: busca é POST com o termo no body — nunca query param. */
export function PatientSearch({ onSelect }: PatientSearchProps) {
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (term: string) => {
    if (!term || term.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setIsSearching(true);
    try {
      const response = await patientsApi.search(term.trim());
      if (response.error) throw new Error(response.error);
      setResults(response.data || []);
      setSearched(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao buscar pacientes.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <InputSearch
        name="patient-search"
        variant="input"
        placeholder="Nome ou telefone (mín. 2 caracteres)"
        showSearchButton
        onSearch={handleSearch}
      />
      {isSearching && <p className="text-sm text-muted-foreground">Buscando…</p>}
      {!isSearching && searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma paciente encontrada.</p>
      )}
      {results.length > 0 && (
        <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {results.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                onClick={() => onSelect(patient)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary/60"
              >
                <span className="font-medium">{patient.full_name}</span>
                <span className="text-muted-foreground">{patient.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
