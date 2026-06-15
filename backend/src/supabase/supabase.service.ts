import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your_') && !supabaseKey.includes('your_')) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.isConfigured = true;
        this.logger.log('🚀 Supabase Storage Service successfully initialized.');
      } catch (err) {
        this.logger.error('Failed to initialize Supabase client:', err.stack);
      }
    } else {
      this.logger.warn(
        '⚠️ Supabase credentials not configured. Falling back to local storage for image uploads.',
      );
    }
  }

  async uploadImage(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<string> {
    if (this.isConfigured && this.supabase) {
      const bucketName = 'product-images';
      this.logger.log(`Uploading ${filename} to Supabase Storage bucket "${bucketName}"...`);

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(filename, fileBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase upload failed: ${error.message}`);
        // Fall back to local storage instead of throwing an error
        this.logger.warn('Falling back to local storage for this upload.');
        return this.saveLocally(fileBuffer, filename);
      }

      // Retrieve public CDN URL
      const { data: publicUrlData } = this.supabase.storage
        .from(bucketName)
        .getPublicUrl(filename);

      this.logger.log(`Supabase upload complete: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } else {
      return this.saveLocally(fileBuffer, filename);
    }
  }

  private saveLocally(fileBuffer: Buffer, filename: string): string {
    const uploadDir = './public/uploads';
    this.logger.log(`Saving file locally to ${uploadDir}/${filename}...`);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, fileBuffer);

    this.logger.log(`File saved locally at: ${filePath}`);
    return `/public/uploads/${filename}`;
  }
}
