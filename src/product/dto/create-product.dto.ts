import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsInt } from 'class-validator';


export class CreateProductDto {

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  available: boolean; 

  @IsOptional()
  @IsInt()
  stock: number;

}
