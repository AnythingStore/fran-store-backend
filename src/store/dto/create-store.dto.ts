import { IsOptional, IsString } from "class-validator"

export class CreateStoreDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  facebook: string;

  @IsOptional()
  @IsString()
  instagram: string;

  @IsOptional()
  @IsString()
  openDays:string;
}

// phone       String  @default("")
// email       String  @default("")
// facebook    String  @default("")
// instagram   String  @default("")