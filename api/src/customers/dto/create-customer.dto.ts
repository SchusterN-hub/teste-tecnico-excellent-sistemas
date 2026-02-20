import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsNotEmpty, Length } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Excellent Sistemas LTDA' })
  @IsString()
  @IsNotEmpty()
  razao_social: string;

  @ApiProperty({
    example: '12345678000199',
    description: 'CNPJ apenas números',
  })
  @IsString()
  @Length(14, 14, { message: 'O CNPJ deve ter exatamente 14 dígitos' })
  cnpj: string;

  @ApiProperty({ example: 'contato@excellent.com.br' })
  @IsEmail()
  email: string;
}
