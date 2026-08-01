"use client";

import React, { createContext, useContext } from "react";
import { Label as LabelComponent } from "@/components/ui/label";
import { Tooltip } from "@/components/Tooltip";
import { Info } from "lucide-react";

// Contexto para registrar campos obrigatórios
export const RequiredFieldsContext = createContext<
  ((fieldName: string) => void) | null
>(null);

// Hook para registrar campos obrigatórios
export const useRegisterRequiredField = () => {
  return useContext(RequiredFieldsContext);
};

interface LabelProps extends React.ComponentProps<typeof LabelComponent> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  infoText?: string | React.ReactNode;
  helpTip?: string;
  htmlFor?: string;
}

export const Label = ({
  children,
  icon,
  infoText,
  htmlFor,
  ...props
}: LabelProps) => {
  return (
    <LabelComponent
      htmlFor={htmlFor}
      className="font-medium text-sm text-stone-700 dark:text-stone-300 mb-2 relative"
      {...props}
    >
      {icon}
      {children}
      {infoText && (
        <Tooltip content={infoText} className="absolute top-0 right-0">
          <Info className="h-4 w-4 text-muted-foreground" />
        </Tooltip>
      )}
    </LabelComponent>
  );
};
