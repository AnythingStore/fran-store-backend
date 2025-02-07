import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ImageService } from 'src/image/image.service';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';
import { ChangeImageOrder as ChangeImageOrderDto } from './dto/change-image-order.dto';
import { haveSameValues } from 'src/utils/orders';
import { VerifyShoppingCartDto } from './dto/verify-shopping-cart.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache //cache,
  ) {

  }

  readonly maxProductsByCategory = 20;
  readonly bucketName = 'products';
  readonly optionTrancitions = {
    maxWait: 30000, // Incrementar el tiempo de espera máximo a 30 segundos
    timeout: 30000, // Incrementar el tiempo de espera de la transacción a 30 segundos
  };

  private async updateCagheProductsHome() {
    await this.cacheManager.del('productsHome');
  }

  async updateCache() {
    const products = await this.prisma.product.findMany({
      include: {
        images: {
          select: {
            url: true,
            id: true,
          },
        },
      },
    });
    await this.updateCagheProductsHome();
    await this.cacheManager.del('productsAll');
  }


  async create(createProductDto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: {
        id: createProductDto.categoryId,
      }
    });
    if (!category) throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found`);

    const result = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        available: createProductDto.available,
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
        images: {
          select: {
            id: true,
            url: true,
          },
        }
      }
    });
  }

  async find(name: string, categoryId?: number) {

    return await this.prisma.product.findMany({
      where: {
        categoryId: categoryId,
        available: true,
        name: {
          contains: name,
          mode: 'insensitive',
        }
      },
      include: {
        images: {
          select: {
            url: true,
            id: true,

          },
        },
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: {
        id: id
      },
      include: {
        images: {
          select: {
            url: true,
            id: true,

          },
        }
      }
    });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    return product;
  }

  async findProductsHome() {
    const categories = await this.prisma.category.findMany({
      include: {
        image: {
          select: {
            url: true,
            id: true,

          },
        }
      }
    });

    const productByCategory = [];

    for (const category of categories) {
      const products = await this.prisma.product.findMany({
        where: {
          available: true,
          categoryId: category.id,
        },
        take: this.maxProductsByCategory,
        include: {
          images: {
            select: {
              url: true,
              id: true,

            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        }
      });

      productByCategory.push({
        category: category,
        products: products
      });
    }

    return productByCategory;
  }
  async verifyShoppingCart(data: VerifyShoppingCartDto): Promise<Object> {

    const listIds = data.items.map(item => item.id);
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: listIds,
        },
        available: true
      },
    });
    const productMap = new Map(products.map(product => [product.id, product]));
    const missingProducts = [];
    const insufficientStockProducts = [];

    for (const item of data.items) {
      const product = productMap.get(item.id);
      if (!product) {
        missingProducts.push(item.id);
      } else if (product.stock < item.stock) {
        insufficientStockProducts.push({ id: item.id, availableStock: product.stock });
      }
    }

    return {
      missingProducts,
      insufficientStockProducts,
    };
  }

  //CRUD

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
        stock: updateProductDto.stock,
        available: updateProductDto.available,
      }
    });

    await this.updateCache();
    return product;
  }

  async remove(id: number) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const product = await this.prisma.product.findUnique({
        where: {
          id: id
        },
        include: {
          images: true
        }
      });

      const imageIds = product.images.map(image => image.id);
      await this.imageService.deleteMany(imageIds, this.bucketName);

      if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
      const result = await this.prisma.product.delete({
        where: {
          id: id
        }
      });

      return { result: result, massage: `Product with ID ${id} deleted, and ${imageIds.length} images deleted` };
    }, this.optionTrancitions
    );

    await this.updateCache();
    return result;
  }

  async deleteManyImages(id: number, imagesId: number[]) {
    return await this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.findUnique({
        where: { id },
        include: { images: true },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      let imagesDeletedId: number[] = [];
      console.log(`product.images ${product.images.length}`);
      if (product && product.images.length > 0) {
        imagesDeletedId = (await this.imageService.deleteMany(imagesId, this.bucketName)).map(e => e.id);
      }
      console.log(`product.images ${product.images}`);
      console.log(`product.images ${product.images}`);

      //updates orders images
      const lisImageIds: number[] = Array.isArray(product.orderImage) ? product.orderImage as number[] : [];
      const newLisImageIds = lisImageIds.filter(id => !imagesDeletedId.includes(id));
      await this.prisma.product.update({
        where: {
          id
        },
        data: {
          orderImage: newLisImageIds
        }
      });
      await this.updateCache();
    }, this.optionTrancitions);
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

      console.log(1);
      const imagesUpload: { publicURL: string, filename: string }[] = await this.storageService.uploadImages(files, this.bucketName);
      console.log(2);


      const images = await this.prisma.image.createManyAndReturn({
        data: imagesUpload.map(image => ({
          filename: image.filename,
          mimetype: files[0].mimetype,
          url: image.publicURL,
        })),
      });
      console.log(3);
      //orders images
      const lisImageIds: number[] = Array.isArray(product.orderImage) ? product.orderImage as number[] : [];
      const newLisImageIds = lisImageIds.concat(images.map(e => e.id));
      console.log(`lisImageIds ${lisImageIds}`);
      console.log(`newLisImageIds ${newLisImageIds}`);
      console.log(`newLisImageIds ${newLisImageIds}`);
      console.log(`lisImageIds ${lisImageIds.length}`);
      console.log(`newLisImageIds ${newLisImageIds.length}`);
      console.log(`lisImageIds ${lisImageIds.toString()}`);
      console.log(`newLisImageIds ${newLisImageIds.toString()}`);
      await this.prisma.product.update({
        where: {
          id
        },
        data: {
          orderImage: newLisImageIds,
          images: { connect: newLisImageIds.map(imageId => ({ id: imageId })) }
        }
      })
      console.log(4);
      await this.updateCache();
      console.log(5);
      return {
        message: `${files.length} images uploaded successfully`,
        filePath: files.map(file => file.path),
        listImagesId: images.map(i => i.id),
      };
    }, this.optionTrancitions);
  }
  async changeImagesOrder(id: number, changeImageOrderDto: ChangeImageOrderDto) {
    const product = await this.prisma.product.findUnique({ where: { id: id }, include: { images: { select: { id: true } } } });
    if (!product) throw new NotFoundException(`Product with ID ${id} not found`);
    if (!haveSameValues(changeImageOrderDto.orderImage, product.images.map(image => image.id))) throw new BadRequestException(`Error change, the order product have ${product.images.map(image => image.id)} and you pass ${changeImageOrderDto.orderImage}`);
    await this.prisma.product.update({
      where: {
        id
      },
      data: {
        orderImage: changeImageOrderDto.orderImage
      }
    },);
    await this.updateCache();
  }




}