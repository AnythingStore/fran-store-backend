import { Injectable, NotFoundException } from '@nestjs/common';
import { Image } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';

@Injectable()
export class ImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService
  ) { }
  async delete(imageId: number | null, bucket: string) {
    if (imageId == null) {
      return;
    }
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Product not found');
    }

    await this.storageService.deleteImage(image.filename, bucket);

    const result = await this.prisma.image.delete({
      where: { id: image.id },
    });

    return image;
  }


  async deleteMany(imagesId: number[], bucket: string) {
    if (imagesId.length == 0) {
      return;
    }
    const images = await this.prisma.image.findMany({
      where: { id: { in: imagesId } },
    });

    if (!images) {
      throw new NotFoundException('Product not found');
    }

    await this.storageService.deleteManyImages(images.map(image => image.filename), bucket);

    const result = await this.prisma.image.deleteMany({
      where: { id: { in: imagesId } },
    });

    return images;
  }


  async create(file:Express.Multer.File, bucketName:string):Promise<number>{
    const { publicURL, filename } = await this.storageService.uploadImage(file, bucketName);

    const result = await this.prisma.image.create({
      data: {
        filename: filename,
        mimetype: file.mimetype,
        url: publicURL,
      },
    });
    return result.id;
  }

  async replace(image:Image|null, file:Express.Multer.File, bucketName:string):Promise<number>{
    if(image){
      await this.delete(image.id, bucketName);
    }
    return await this.create(file, bucketName);
  }
}
