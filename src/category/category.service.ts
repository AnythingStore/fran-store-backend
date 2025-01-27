import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma.service';
import { ProductService } from 'src/product/product.service';
import { ImageService } from 'src/image/image.service';
import { StorageService } from 'src/storage.service';


@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService,
    private readonly productService: ProductService,
    private readonly imageService: ImageService,
    private readonly storageService: StorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  readonly bucketName = 'category';

  private async updateCache() {
    await this.productService.updateCache();
    const categories = await this.prisma.category.findMany();
    await this.cacheManager.set('category', categories, 0);
    // console.log('Category cache updated');
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const result = await this.prisma.category.create({
      data: createCategoryDto
    })
    await this.updateCache();
    return result;
  }

  async findAll() {
    return await this.prisma.category.findMany();
  }

  async findOne(id: number) {
    return await this.prisma.category.findUnique({
      where: {
        id: id
      }
    });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const result = await this.prisma.category.update({
      where: {
        id: id
      },
      data: updateCategoryDto
    });
    await this.updateCache();
    return result;
  }

  async remove(id: number) {
    return await this.prisma.$transaction(async (prisma) => {

      const category = await this.prisma.category.findUnique({
        where: {
          id: id
        }
      });
      if (!category) throw new NotFoundException('Category not found');

      const products = await this.prisma.product.findMany({
        where: {
          categoryId: id
        },
        select: {
          id: true
        }
      });

      const resultDeleteProducts = await this.prisma.product.deleteMany({
        where: {
          categoryId: id
        }
      });

      const productsImages = await this.prisma.image.findMany({
        where: {
          productId: {
            in: products.map(product => product.id)
          },
        },
        select: {
          id: true
        }
      });
      const productsImagesDeletecd = await this.imageService.deleteMany(productsImages.map(image => image.id), this.productService.bucketName);
      const categoryImage = await this.imageService.delete(category.imageId, this.productService.bucketName);

      const result = await this.prisma.category.delete({
        where: {
          id: id
        }
      });
      await this.updateCache();
      return { result: result, message: `Category deleted successfully,category image deleted ${categoryImage} products deleted ${products} image of product deleted ${productsImages}` };
    });

  }


  
  async putImage(id:number, file: Express.Multer.File) {
    return await this.prisma.$transaction(async (prisma) => {
      const category = await prisma.category.findUnique({
        where: { id },
        include: { image: true },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      const imageId = await this.imageService.replace(category.image, file, this.bucketName);
      
      await this.prisma.category.update({
        where: { id },
        data: { imageId: imageId },
      });

      await this.updateCache();
      return {
        message: `${file} images uploaded successfully`,
        filePath: file.path,
      };
    });
  }

}
