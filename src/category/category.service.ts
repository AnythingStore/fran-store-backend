import { Inject, Injectable, NotFoundException, Param, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
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

  readonly bucketName = 'categories';
  readonly optionTrancitions = {
    maxWait: 50000,
    timeout: 50000,
  };

  async updateCache() {
    const categories = await this.prisma.category.findMany({
      include: {
        image: {
          select: {
            id: true,
            url: true
          }
        }
      }
    });

    await this.cacheManager.set('category', categories, 0);
    await this.productService.updateCache();
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
    return await this.prisma.category.findMany({
      include: {
        image: {
          select: {
            id: true,
            url: true
          }
        }
      }
    });
  }

  async findOne(id: number) {
    return await this.prisma.category.findUnique({
      where: {
        id: id
      },
      include: {
        image: {
          select: {
            id: true,
            url: true
          }
        }
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
    const result = await this.prisma.$transaction(async (prisma) => {
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
          id: true,
          images: {
            select: {
              id: true
            }
          }
        }
      });

      const productsImages: number[] = products.flatMap(product => product.images.map(image => image.id));

      //delete all image of all products of this category
      const productsImagesDeletecd = await this.imageService.deleteMany(productsImages, this.productService.bucketName);

      //delete all products of this category
      const resultDeleteProducts = await this.prisma.product.deleteMany({
        where: {
          categoryId: id
        }
      });

      //delete image of this category
      console.log(`category.imageId ${category.imageId}`);
      const categoryImage = await this.imageService.delete(category.imageId, this.bucketName);

      //delete this category
      const result = await this.prisma.category.delete({
        where: {
          id: id
        }
      });
      return { result: result, message: `Category deleted successfully, category image deleted ${categoryImage}, products deleted ${products}, images of products deleted ${productsImages}` };
    }, this.optionTrancitions);
    await this.updateCache();
    return result;
  }



  async putImage(id: number, file: Express.Multer.File) {
    return await this.prisma.$transaction(async (prisma) => {
      const category = await prisma.category.findUnique({
        where: { id },
        include: { image: true },
      });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      console.log(1);

      const imageId = await this.imageService.replace(category.image, file, this.bucketName);

      console.log(2);
      await this.prisma.category.update({
        where: { id },
        data: { imageId: imageId },
      });
      console.log(3);

      await this.updateCache();
      console.log(4);
      return {
        message: `${file} images uploaded successfully`,
        filePath: file.path,
      };
    }, this.optionTrancitions);
  }




}
