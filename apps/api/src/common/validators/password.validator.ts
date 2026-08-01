import { applyDecorators } from '@nestjs/common';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Política de senha para CRIAÇÃO/TROCA de senha (registro, criação de
 * usuário, alteração de senha). NÃO usar em DTO de login — login autentica
 * contra o hash já salvo; endurecer a validação ali rejeitaria com 400 o
 * login de contas antigas com senha fraca em vez de deixar o fluxo normal de
 * autenticação (e eventual exigência de troca) decidir.
 */
export function IsStrongPassword() {
  return applyDecorators(
    IsString(),
    MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' }),
    MaxLength(128, { message: 'Senha deve ter no máximo 128 caracteres' }),
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
      message: 'Senha deve conter ao menos uma letra maiúscula, uma minúscula e um número',
    })
  );
}
