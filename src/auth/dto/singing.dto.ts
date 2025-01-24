import { IsString } from "class-validator";


export class CHangeCredentialsDto {
  
  @IsString()
  username: string;

}
