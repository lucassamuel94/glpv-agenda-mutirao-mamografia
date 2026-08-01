import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'carlos@ezfrotas.com.br',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Senha do usuário (mínimo 6 caracteres)',
    example: '123456',
    type: String,
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  // Não é política de complexidade (ver IsStrongPassword) — login autentica
  // contra hash já salvo. Só um teto de tamanho contra payload gigante indo
  // pro bcrypt.
  @MaxLength(128)
  password: string;
}
