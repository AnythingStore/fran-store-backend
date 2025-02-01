import { IsNumber, IsArray, } from 'class-validator';

export class ChangeImageOrder {
 
  @IsArray()
  @IsNumber({}, {each: true})
  orderImage: number[]

}
