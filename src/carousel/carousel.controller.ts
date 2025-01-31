import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Put, UploadedFile } from '@nestjs/common';
import { CarouselService } from './carousel.service';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Public } from 'src/auth/public';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('carousel')
@UseInterceptors(CacheInterceptor)
export class CarouselController {
  constructor(private readonly carouselService: CarouselService) {}

  @Post()
  create(@Body() createCarouselDto: CreateCarouselDto) {
    return this.carouselService.create(createCarouselDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.carouselService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carouselService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCarouselDto: UpdateCarouselDto) {
    return this.carouselService.update(+id, updateCarouselDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carouselService.remove(+id);
  }
  @Put(':id/image')
  @UseInterceptors(FileInterceptor('file', {
      storage: memoryStorage(),
  }))
  putImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.categoryService.putImage(+id, file);
  }
}
