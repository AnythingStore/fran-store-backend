import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';

@Injectable()
export class ImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService
  ) {}
  async removeImage(imageId: number|null, bucket:string) {
    if (imageId==null) {
      return;
    }
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new NotFoundException('Product not found');
    }

    await this.storageService.deleteImage(image.filename, bucket);

    await this.prisma.image.delete({
      where: { id: image.id },
    });

    return {
      message: 'Image deleted successfully',
    };
  }
}
