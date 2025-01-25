import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';
import { ImageService } from 'src/image/image.service';

@Module({
  controllers: [ProductController],
  providers: [
    ProductService,
    PrismaService,
    StorageService,
    ImageService,
  ],
})
export class ProductModule { }
