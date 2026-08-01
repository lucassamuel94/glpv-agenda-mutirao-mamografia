import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

// Função para validar CNPJ
function isValidCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    return false;
  }

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) {
    return false;
  }

  // Validação dos dígitos verificadores
  let sum = 0;
  let weight = 2;

  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const firstDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ[12]) !== firstDigit) {
    return false;
  }

  // Segundo dígito verificador
  sum = 0;
  weight = 2;

  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ[i]) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }

  const secondDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cleanCNPJ[13]) !== secondDigit) {
    return false;
  }

  return true;
}

// Decorator personalizado para validação de CNPJ
export function IsValidCNPJ(validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isValidCNPJ',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value || typeof value !== 'string') return false;

          // Normaliza o CNPJ para apenas números
          const normalizedCNPJ = value.replace(/\D/g, '');

          return isValidCNPJ(normalizedCNPJ);
        },
        defaultMessage(args: ValidationArguments) {
          return 'CNPJ inválido';
        },
      },
    });
  };
}
