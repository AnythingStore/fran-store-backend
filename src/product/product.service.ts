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


  async updateCache() {
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
        // categoryId:3,
        category: createProductDto.categoryId ? { connect: { id: createProductDto.categoryId } } : undefined,

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
      data: {
        name: updateProductDto.name,
        description: updateProductDto.description,
        price: updateProductDto.price,
        categoryId: updateProductDto.categoryId,
      }
    });

    await this.updateCache();
    return product;
  }

  async remove(id: number) {
    return await this.prisma.$transaction(async (prisma) => {
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
      const imageIds = product.images.map(image => image.id);
      await this.imageService.deleteMany(imageIds, this.bucketName);
      await this.updateCache();
      return { result: result, massage: `Product with ID ${id} deleted, and ${imageIds.length} images deleted` };
    }
    );
  }


  async deleteManyImages(id:number, imagesId: number[]) {
    return await this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      if (product && product.images.length > 0) {
        await this.imageService.deleteMany(product.images.map(image=>image.id), this.bucketName);
      }
      await this.updateCache();
    });
  }

  async uploadManyImages(id: number, files: Express.Multer.File[]) {
    return await this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      const imagesUpload: {publicURL:string, filename:string}[] = await this.storageService.uploadImages(files, this.bucketName);


      const images = await this.prisma.image.createManyAndReturn({
        data: imagesUpload.map(image=>({
          filename: image.filename,
          mimetype: files[0].mimetype,
          url: image.publicURL,
        })),
      });

      await this.updateCache();
      return {
        message: `${files.length} images uploaded successfully`,
        filePath: files.map(file=>file.path),
      };
    });
  }
}