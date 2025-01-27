import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { PrismaService } from 'src/prisma.service';
import { ProductService } from 'src/product/product.service';
import { Product } from 'src/product/entities/product.entity';
import { ProductModule } from 'src/product/product.module';
import { StorageService } from 'src/storage.service';
import { ImageService } from 'src/image/image.service';

@Module({
  imports: [ProductModule],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    PrismaService,
    ProductService,
    StorageService,
    ImageService,
  ],
})
export class CategoryModule { }
