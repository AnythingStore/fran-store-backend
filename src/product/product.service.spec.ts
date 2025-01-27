import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { StorageService } from 'src/storage.service';
import exp from 'constants';
import { ImageService } from 'src/image/image.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});



describe('ProductService CRUD', () => {
  let service: ProductService;
  let prisma: PrismaService;
  let storage: StorageService;
  let image: ImageService;


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService, PrismaService, StorageService, ImageService],
    }).compile();

    service = module.get<ProductService>(ProductService);
    prisma = module.get<PrismaService>(PrismaService);
    storage = module.get<StorageService>(StorageService);
    image = module.get<ImageService>(ImageService);
  });

  it('should be defined', async () => {
    // Step 1: Add a product
    const product = {
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      categoryId: null,
    }

    const createdProduct = await service.create(product);
    expect(createdProduct).toMatchObject(product);

    // Step 2: Update the product
    const updatedProductDto = {
      name: 'Updated Product',
      description: 'Updated Description',
      price: 200,
      categoryId: null,
    }

    const updatedProduct = await service.update(createdProduct.id, updatedProductDto);
    expect(updatedProduct).toMatchObject(updatedProductDto);

    // Step 3: Add image to the product
    const image1 = { filename: 'image1.jpg', mimetype: 'image/jpeg' };
    const image2 = { filename: 'image2.jpg', mimetype: 'image/jpeg' };

    // await service.(createdProduct.id, image1);
    // await service.addImage(createdProduct.id, image2);

    const productWithImages = await service.findOne(createdProduct.id);
    expect(productWithImages.images).toHaveLength(2);


    expect(service).toBeDefined();

  });
});