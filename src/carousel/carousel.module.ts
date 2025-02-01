import { Module } from '@nestjs/common';
import { CarouselService } from './carousel.service';
import { CarouselController } from './carousel.controller';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';
import { ImageService } from 'src/image/image.service';
import { StoreService } from 'src/store/store.service';

@Module({
  controllers: [CarouselController],
  providers: [
    CarouselService,
    PrismaService,
    StorageService,
    ImageService,
    StoreService,
  ],
})
export class CarouselModule { }
