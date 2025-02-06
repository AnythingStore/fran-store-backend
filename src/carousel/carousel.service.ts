import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma.service';
import { ImageService } from 'src/image/image.service';
import { StorageService } from 'src/storage.service';
import { ChangeCarouselOrderDto } from './dto/change-order-carousel.dto';
import { haveSameValues } from 'src/utils/orders';


@Injectable()
export class CarouselService {
  constructor(private prisma: PrismaService,
    private readonly imageService: ImageService,
    private readonly storageService: StorageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }
  readonly bucketName = 'carousel';
  readonly optionTrancitions = {
    maxWait: 50000, // Incrementar el tiempo de espera máximo a 30 segundos
    timeout: 50000, // Incrementar el tiempo de espera de la transacción a 30 segundos
  };
  async updateCache() {
    const carousel = await this.prisma.carousel.findMany({ include: { image: true } });
    await this.cacheManager.set('carousel', carousel, 0);
    const carouselOrder = await this.prisma.carouselOrder.findFirst();
    let order = { id: carouselOrder.id, order: Array.isArray(carouselOrder.orderCarousel) ? carouselOrder.orderCarousel as number[] : [] };
   
  
  }
  async updateCacheOrder() {
    const carouselOrder = await this.prisma.carouselOrder.findFirst();
    let order = { id: carouselOrder.id, order: Array.isArray(carouselOrder.orderCarousel) ? carouselOrder.orderCarousel as number[] : [] };
    await this.cacheManager.set('carouselOrder', order, 0);
  }

  async findOrCreateOrder(): Promise<{ id: number, order: number[] }> {
    let result = await this.prisma.carouselOrder.findFirst();
    if (!result) {
      let carousel = await this.prisma.carousel.findMany();
      result = await this.prisma.carouselOrder.create({
        data: {
          orderCarousel: carousel.map(c => c.id)
        }
      });
      await this.updateCacheOrder();
    }
    return { id: result.id, order: Array.isArray(result.orderCarousel) ? result.orderCarousel as number[] : [] };
  }
  async create(createCarouselDto: CreateCarouselDto) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const resultCreate = await prisma.carousel.create({
        data: createCarouselDto
      });

      //Update Order Carousel
      const carouselOrder = await this.findOrCreateOrder();
      const newOrder = [...carouselOrder.order, resultCreate.id];
      await prisma.carouselOrder.update({
        where: { id: carouselOrder.id },
        data: {
          orderCarousel: newOrder
        }
      });
      return resultCreate;
    }, this.optionTrancitions,
    );

    await this.updateCache();
    await this.updateCacheOrder();
    return result;
  }

  async findAll() {
    return await this.prisma.carousel.findMany({ include: { image: true } });
  }

  async findOne(id: number) {
    return await this.prisma.carousel.findUnique({
      where: {
        id: id
      },
      include: { image: true }
    });
  }

  async update(id: number, updateCarouselDto: UpdateCarouselDto) {
    const result = await this.prisma.carousel.update({
      where: {
        id: id
      },
      data: updateCarouselDto
    });
    await this.updateCache();
    return result;
  }

  async remove(id: number) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const carousel = await prisma.carousel.findUnique({
        where: {
          id: id
        },
        include: { image: true }
      });

      if (!carousel) throw new NotFoundException(`carousel with id ${id} not found`);

      //delete image of carousel
      const resultDeleteImageCarousel = await this.imageService.delete(carousel.image?.id, this.bucketName);

      //Update Order Carousel
      const orderCarousel = await this.findOrCreateOrder();
      const newOrder = orderCarousel.order.filter((e) => e != id);
      await prisma.carouselOrder.update({
        where: { id: orderCarousel.id },
        data: {
          orderCarousel: newOrder
        }
      });

      const result = await prisma.carousel.delete({
        where: {
          id: id
        },
        include: { image: true }
      });


      return { result: result, message: `carousel with id ${id} deleted, image deleted: ${resultDeleteImageCarousel}` };
    }, this.optionTrancitions);
    await this.updateCache();
    await this.updateCacheOrder();
    return result;
  }

  async putImage(id: number, file: Express.Multer.File) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const carousel = await prisma.carousel.findUnique({
        where: { id },
        include: { image: true },
      });
      if (!carousel) throw new NotFoundException(`carousel with id ${id} not found`);
      const imageId: number = await this.imageService.replace(carousel.image, file, this.bucketName);
      const result = await prisma.carousel.update({
        where: { id },
        data: {
          imageId: imageId
        },
      });
      return {
        message: `${file} images uploaded successfully`,
        filePath: file.path,
      };
    }, this.optionTrancitions);
    await this.updateCache();
    return result;
  }

  async changeOrder(changeCarouselOrderDto: ChangeCarouselOrderDto) {
    const result = await this.prisma.$transaction(async (prisma) => {
      const carouselOrder = await prisma.carouselOrder.findFirst({});
      const carousels = await prisma.carousel.findMany();

      if (!haveSameValues(carousels.map(e => e.id), changeCarouselOrderDto.orderCarousel)) throw new BadRequestException(`Error change, the order carousel have ${carousels.map(carousel => carousel.id)} and you pass ${changeCarouselOrderDto.orderCarousel}`);
      await this.prisma.carouselOrder.update({
        where: {
          id: carouselOrder.id
        },
        data: {
          orderCarousel: changeCarouselOrderDto.orderCarousel
        }
      });

      return { message: 'order updated successfully' };
    }, this.optionTrancitions);
    await this.updateCache();
    await this.updateCacheOrder();
    return result;
  }
}
