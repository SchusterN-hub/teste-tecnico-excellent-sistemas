import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome completo do usuário' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'E-mail válido e único' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha com no mínimo 6 caracteres' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, required: false, default: UserRole.USUARIO })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
