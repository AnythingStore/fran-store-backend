import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from 'src/prisma.service';
import { ImageService } from 'src/image/image.service';
import { StorageService } from 'src/storage.service';


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
  private async updateCache() {
    const carousel = await this.prisma.carousel.findMany({ include: { image: true } });
    await this.cacheManager.set('carousel', carousel, 0);
  }

  async create(createCarouselDto: CreateCarouselDto) {
    const result = await this.prisma.carousel.create({
      data: createCarouselDto
    });
    await this.updateCache();
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
    return await this.prisma.$transaction(async (prisma) => {
      const carousel = await prisma.carousel.findUnique({
        where: {
          id: id
        },
        include: { image: true }
      });

      if (!carousel) throw new NotFoundException(`carousel with id ${id} not found`);

      //delete image of carousel
      const resultDeleteImageCarousel = await this.imageService.delete(carousel.image.id, this.bucketName);

      const result = await prisma.carousel.delete({
        where: {
          id: id
        },
        include: { image: true }
      });

      await this.updateCache();
      return { result: result, message: `carousel with id ${id} deleted, image deleted: ${resultDeleteImageCarousel}` };
    }, this.optionTrancitions);
  }

  async putImage(id: number, file: Express.Multer.File) {
    return await this.prisma.$transaction(async (prisma) => {
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
      await this.updateCache();
      return {
        message: `${file} images uploaded successfully`,
        filePath: file.path,
      };
    }, this.optionTrancitions);
  }
}
