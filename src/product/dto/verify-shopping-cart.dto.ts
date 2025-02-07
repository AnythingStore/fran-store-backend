import { IsNumber, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';


export class ItemCart {
  @IsInt()
  @IsPositive()
  id: number;

  @IsPositive()
  @IsInt()
  stock: number;
}


export class VerifyShoppingCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCart)
  items: ItemCart[];
}