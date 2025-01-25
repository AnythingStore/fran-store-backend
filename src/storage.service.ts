import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';

@Injectable()
export class StorageService {
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL'),
      this.configService.get<string>('ANON_KEY')
    );
  }

  
  generateFilename(originalname: string, fieldname: string): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = extname(originalname);
    return `${fieldname}-${uniqueSuffix}${ext}`;
  }

  async uploadImage(file: Express.Multer.File, bucket: string): Promise<{publicURL: string, filename: string}> {
    const filename = this.generateFilename(file.originalname, file.fieldname);

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(`public/${filename}`, file.buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.mimetype,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data: publicURL} = this.supabase
      .storage
      .from(bucket)
      .getPublicUrl(`public/${filename}`);


    return {publicURL:publicURL.publicUrl, filename:filename};
  }

  async deleteImage(filename: string, bucket: string): Promise<void> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .remove([`public/${filename}`]);

    if (error) {
      throw new Error(`Failed to delete image from storage: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to delete image: No data returned');
    }
  }
}