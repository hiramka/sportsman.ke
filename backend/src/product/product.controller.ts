import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  async getAllProducts() {
    return this.productService.findAll();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  // Gated Admin PNG upload endpoint
  @Post('upload-image')
  @UseGuards(AuthGuard)
  @Roles('admin')
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(png)$/)) {
          return callback(new BadRequestException('Access Denied: Only PNG files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    }),
  )
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No image file provided.');
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    const filename = `product-${uniqueSuffix}${ext}`;
    
    const imageUrl = await this.supabaseService.uploadImage(
      file.buffer,
      filename,
      file.mimetype,
    );
    return { imageUrl };
  }

  // Guarded Admin CRUD write operations
  @Post()
  @UseGuards(AuthGuard)
  @Roles('admin')
  async createProduct(@Body() productDto: any) {
    return this.productService.create(productDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async updateProduct(@Param('id') id: string, @Body() productDto: any) {
    return this.productService.update(id, productDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async deleteProduct(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}
