export const maskPhone = (value: string) => {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
};

export const maskCurrency = (value: string) => {
  if (!value) return "";
  const numericValue = value.replace(/\D/g, "");
  const floatValue = parseFloat(numericValue) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(floatValue);
};

/** Máscara apenas CNPJ: XX.XXX.XXX/XXXX-XX (14 dígitos) */
export const cnpjMask = (value: string) => {
  if (!value) return "";
  const cleanValue = value.replace(/\D/g, "").slice(0, 14);
  return cleanValue
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

export const maskCpfCnpj = (value: string) => {
  if (!value) return "";
  const cleanValue = value.replace(/\D/g, "");

  if (cleanValue.length <= 11) {
    // CPF
    return cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  } else {
    // CNPJ
    return cleanValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  }
};

export const unmask = (value: string) => {
  return value.replace(/\D/g, "");
};
