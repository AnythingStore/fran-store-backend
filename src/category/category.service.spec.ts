import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './category.service';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';
import { ImageService } from 'src/image/image.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: PrismaService;
  let storage: StorageService;
  let image: ImageService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, StorageService, ImageService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    storage = module.get<StorageService>(StorageService);
    image = module.get<ImageService>(ImageService);
  });
  //////////////////////
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('simple crud', async () => {
    // Step 1: Add a category
    const categoryDto = {
      name: 'Category Test',
    }

    const createdProduct = await service.create(categoryDto);
    expect(createdProduct).toMatchObject(categoryDto);

    // Step 2: Update the product
    const updatedProductDto = {
      name: 'Updated Category',
    }

    const updatedProduct = await service.update(createdProduct.id, updatedProductDto);
    expect(updatedProduct).toMatchObject(updatedProductDto);

    console.log(`category ${await service.findOne(updatedProduct.id)}`);
    expect(service).toBeDefined();

  });
});