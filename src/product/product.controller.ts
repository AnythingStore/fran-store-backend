import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';
import { Public } from 'src/auth/public';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChangeImageOrder as ChangeImageOrderDto } from './dto/change-image-order.dto';

@Controller('product')
@UseInterceptors(CacheInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Public()
  @Get()
  @CacheKey('products')
  findAll() {
    return this.productService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }

  @Post(':id/image')
  @UseInterceptors(FilesInterceptor('files',10, {
    storage: memoryStorage(),
  }))
  uploadImage(@Param('id') id: String, @UploadedFiles() files: Express.Multer.File[]) {
    return this.productService.uploadManyImages(+id, files);
  }
  
  @Delete(':id/images')
  deleteImages(@Param('id') id: string, @Body('imageIds') imageIds: number[]) {
    return this.productService.deleteManyImages(+id, imageIds);
  }

  @Patch(':id/change_images_order')
  changeOrder(@Param('id') id: string, @Body() changeImageOrderDto: ChangeImageOrderDto) {
    return this.productService.changeImagesOrder(+id, changeImageOrderDto);
  }

}
