import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CacheInterceptor, CacheKey } from '@nestjs/cache-manager';
import { Public } from 'src/auth/public';


@UseInterceptors(CacheInterceptor)
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Public()
  @Get()
  @CacheKey('store')
  findAll() {
    return this.storeService.findOrCreate();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storeService.update(updateStoreDto);
  }

   @Put(':id/image')
    @UseInterceptors(FileInterceptor('file', {
      storage: memoryStorage(),
    }))
    putImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
      return this.storeService.putImage(file);
    }


    
}
