import { IsString } from "class-validator";


export class SingingDto {
  
  @IsString()
  username: string;

  @IsString()
  password: string;
}
