import { useContext } from "react";
import { createContext } from "react";
import { z } from "zod";

// Contexto para o schema de validação
export const SchemaContext = createContext<z.ZodSchema | null>(null);

// Hook para acessar o schema
export const useSchema = () => {
  const schema = useContext(SchemaContext);
  return schema;
};

