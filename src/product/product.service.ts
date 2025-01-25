import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';


import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ImageService } from 'src/image/image.service';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache //cache,
  ) {

  }
  readonly bucketName = 'products';


  private async updateCache() {
    const products = await this.prisma.product.findMany({
      include: {
        images: true,
      }
    }
    );

    await this.cacheManager.set('products', products, 0);
  }


  async create(createProductDto: CreateProductDto) {
    const result = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        categoryId: createProductDto.categoryId,
        images: null
      },
    });

    await this.updateCache();
    return result;
  }

  async findAll() {
    return await this.prisma.product.findMany({
      include: {
        images: true
      }
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: id
      },
      include: {
        images: true
      }
    });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.update({
      where: {
        id: id
      },
      data: updateProductDto
    });

    await this.updateCache();
    return product;
  }

  async remove(id: number) {

    const product = await this.prisma.product.findUnique({
      where: {
        id: id
      },
      include: {
        images: true
      }
    });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);

    const result = await this.prisma.product.delete({
      where: {
        id: id
      }
    });

    await this.updateCache();
    return result;
  }
}
