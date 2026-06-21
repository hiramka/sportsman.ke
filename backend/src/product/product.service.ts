import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/Product.entity';
import Redis from 'ioredis';

@Injectable()
export class ProductService implements OnModuleDestroy {
  private redisClient: Redis | null = null;
  private memoryCache = new Map<string, string>(); // Sandbox Memory Cache Fallback
  private useRedis = false;
  private hasWarnedRedis = false;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    this.initializeRedis();
  }

  // Gracefully initialize Redis sandbox driver
  private initializeRedis() {
    const host = process.env.REDIS_HOST;
    const port = parseInt(process.env.REDIS_PORT, 10) || 6379;

    if (!host) {
      console.log('⚡ Redis host not configured. Falling back to local high-speed memory cache.');
      this.useRedis = false;
      return;
    }

    console.log(`🔌 Initializing Redis cache on redis://${host}:${port}...`);
    
    try {
      this.redisClient = new Redis({
        host,
        port,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            // End reconnecting
            return null;
          }
          return Math.min(times * 100, 1000);
        }
      });

      this.redisClient.on('connect', () => {
        this.useRedis = true;
        this.hasWarnedRedis = false;
        console.log('✓ Redis cache connection established successfully.');
      });

      this.redisClient.on('error', (err) => {
        this.useRedis = false;
        if (!this.hasWarnedRedis) {
          console.log('⚠️ Redis server not available. Falling back to local high-speed memory cache.');
          this.hasWarnedRedis = true;
        }
      });
    } catch (err) {
      this.useRedis = false;
      if (!this.hasWarnedRedis) {
        console.log('⚠️ Redis server initialization failed. Falling back to memory cache.');
        this.hasWarnedRedis = true;
      }
    }
  }

  // Gracefully close client on shutdown
  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  // Evict cache keys
  async evictCache() {
    const key = 'cache:products:all';
    if (this.useRedis && this.redisClient) {
      await this.redisClient.del(key);
      console.log(`⚡ Redis: Evicted cache index key: "${key}"`);
    } else {
      this.memoryCache.delete(key);
      console.log(`⚡ MemoryCache: Evicted cache index key: "${key}"`);
    }
  }

  // Fetch all catalog items with high-speed caching!
  async findAll() {
    const cacheKey = 'cache:products:all';
    
    // 1. Check Caching Layer
    if (this.useRedis && this.redisClient) {
      try {
        const cachedData = await this.redisClient.get(cacheKey);
        if (cachedData) {
          console.log('⚡ Redis Cache HIT: Fetched catalog products instantly.');
          return JSON.parse(cachedData);
        }
      } catch (err) {
        console.log('⚠️ Redis lookup error, falling back to database query.');
      }
    } else {
      const cachedData = this.memoryCache.get(cacheKey);
      if (cachedData) {
        console.log('⚡ MemoryCache HIT: Fetched catalog products instantly.');
        return JSON.parse(cachedData);
      }
    }

    // 2. Cache MISS: Query Database
    console.log('⚡ Cache MISS: Querying PostgreSQL database catalog...');
    const products = await this.productRepository.find();

    // 3. Save to Caching Layer (TTL: 5 minutes / 300s)
    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.set(cacheKey, JSON.stringify(products), 'EX', 300);
      } catch (err) {
        console.log('⚠️ Failed to write catalog payload to Redis.');
      }
    } else {
      this.memoryCache.set(cacheKey, JSON.stringify(products));
    }

    return products;
  }

  async findById(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found.`);
    }
    return product;
  }

  // Write Operation: Create Product (Evicts cache!)
  async create(productDto: any) {
    const product = this.productRepository.create({
      id: `prod-${Date.now()}`,
      name: productDto.name,
      category: productDto.category,
      description: productDto.description,
      price: Number(productDto.price),
      stockQuantity: Number(productDto.stockQuantity),
      reorderThreshold: Number(productDto.reorderThreshold || 3),
      brand: productDto.brand,
      imageUrl: productDto.imageUrl,
      warehouseLocation: productDto.warehouseLocation,
    });

    const saved = await this.productRepository.save(product);
    await this.evictCache(); // Invalidate cache index
    return saved;
  }

  // Write Operation: Update Product (Evicts cache!)
  async update(id: string, productDto: any) {
    const product = await this.findById(id);
    
    product.name = productDto.name;
    product.category = productDto.category;
    product.description = productDto.description;
    product.price = Number(productDto.price);
    product.stockQuantity = Number(productDto.stockQuantity);
    product.reorderThreshold = Number(productDto.reorderThreshold || 3);
    product.brand = productDto.brand;
    product.imageUrl = productDto.imageUrl;
    product.warehouseLocation = productDto.warehouseLocation;

    const saved = await this.productRepository.save(product);
    await this.evictCache(); // Invalidate cache index
    return saved;
  }

  // Write Operation: Delete Product (Evicts cache!)
  async delete(id: string) {
    const product = await this.findById(id);
    await this.productRepository.remove(product);
    await this.evictCache(); // Invalidate cache index
    return { success: true, message: `Product "${product.name}" removed.` };
  }
}
