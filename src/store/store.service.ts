import { Inject, Injectable } from '@nestjs/common';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { PrismaService } from 'src/prisma.service';
import { ImageService } from 'src/image/image.service';
import { StorageService } from 'src/storage.service';


import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DefaultStore } from './entities/store.entities';

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly imageService: ImageService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  readonly bucketName = 'store';
  async updateCache(): Promise<void> {
    const store = await this.prisma.storeInfo.findFirst({
      include: {
        image: true
      }
    });
    await this.cacheManager.set('store', store, 0);
  }

  private async _create() {
    await this.prisma.storeInfo.create({
      data: DefaultStore,
    });
    const store = await this.prisma.storeInfo.findFirst({
      include: {
        image: true
      }
    });

    await this.updateCache();
    return store;
  }

  async findOrCreate() {
    const store = await this.prisma.storeInfo.findFirst({
      include: {
        image: true
      }
    });
    if (!store) {
      await this._create();
    }
    return store;
  }

  async update(updateStoreDto: UpdateStoreDto) {
    const store = await this.findOrCreate();
    const result = await this.prisma.storeInfo.update({
      where: {
        id: store.id
      },
      data: updateStoreDto
    });

    return result;
  }


  async putImage(file: Express.Multer.File) {
    return await this.prisma.$transaction(async (prisma) => {
      const store = await this.findOrCreate();
      
      const imageId = await this.imageService.replace(store.image, file, this.bucketName);

      await this.prisma.storeInfo.update({
        where: { id:store.id },
        data: { imageId: imageId},
      });

      await this.updateCache();
      return {
        message: `${file} images uploaded successfully`,
        filePath: file.path,
      };
    });
  }

}
