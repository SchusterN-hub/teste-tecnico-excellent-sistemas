import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Cadeira Gamer Ergonômica' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1250.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  sale_price: number;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    isArray: true,
    required: false,
  })
  @IsOptional()
  images?: string[];
}
