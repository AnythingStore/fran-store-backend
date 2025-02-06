import { IsString } from "class-validator";
import { ChangePasswordDto } from "./change-password.dto";

export class ChangeAllCredentialsDto extends ChangePasswordDto {

  @IsString()
  username: string;
}