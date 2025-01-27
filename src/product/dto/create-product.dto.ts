import { IsString, IsNumber, IsOptional, IsArray } from 'class-validator';


export class CreateProductDto {

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  categoryId?: number;

}
