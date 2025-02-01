import { IsNumber, IsArray, } from 'class-validator';

export class ChangeCarouselOrderDto {
 
  @IsArray()
  @IsNumber({}, {each: true})
  orderCarousel: number[]

}
