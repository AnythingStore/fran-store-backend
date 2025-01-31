import { Module } from '@nestjs/common';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { PrismaService } from 'src/prisma.service';
import { ImageService } from 'src/image/image.service';
import { StorageService } from 'src/storage.service';

@Module({
  controllers: [StoreController],
  providers: [StoreService, PrismaService, ImageService, StorageService],
})
export class StoreModule {}
