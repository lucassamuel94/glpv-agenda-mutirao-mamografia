"use client";

import { useState } from "react";
import InputSearch from "@/components/InputSearch";
import { patientsApi, type Patient } from "@/lib/api/patients";
import { toast } from "@/lib/toast";
import { EmptyState } from "@/modules/common/empty-state";

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
  showInitialEmptyState?: boolean;
}

/** RN-58: busca é POST com o termo no body — nunca query param. */
export function PatientSearch({ onSelect, showInitialEmptyState = false }: PatientSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (term: string) => {
    if (!term || term.trim().length < 2) {
      setSearchTerm("");
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
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        showSearchButton
        containerClassName="w-full max-w-none"
        onSearch={handleSearch}
      />
      {showInitialEmptyState && !isSearching && !searched && (
        <EmptyState
          kind="patients"
          mode="no-data"
          compact
          title="Busque uma paciente"
          description="Informe nome ou telefone para consultar pacientes e acessar o histórico."
          className="border-0 bg-transparent px-0 shadow-none"
        />
      )}
      {isSearching && <p className="text-sm text-muted-foreground">Buscando…</p>}
      {!isSearching && searched && results.length === 0 && (
        <EmptyState
          kind="patients"
          mode="no-results"
          compact
          title="Nenhuma paciente encontrada"
          description="Tente ajustar o nome ou telefone informado."
          action={{ label: "Limpar busca", onClick: () => handleSearch("") }}
          className="border-0 bg-transparent shadow-none"
        />
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
