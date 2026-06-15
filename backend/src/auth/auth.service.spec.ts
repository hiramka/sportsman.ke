import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/User.entity';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  const mockUserRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    it('should create a new customer and force the role to customer', async () => {
      const signupDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0712345678',
        password: 'password123',
        role: 'admin', // attempt privilege escalation
      };

      mockUserRepository.count.mockResolvedValue(0);
      mockUserRepository.create.mockReturnValue({
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0712345678',
        passwordHash: 'hashedpassword',
        role: 'customer', // Should be forced to customer
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0712345678',
        passwordHash: 'hashedpassword',
        role: 'customer',
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.signup(signupDto);

      expect(userRepository.count).toHaveBeenCalledWith({ where: { email: signupDto.email } });
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'customer', // Force 'customer' role
        })
      );
      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user.role).toBe('customer');
    });

    it('should throw BadRequestException if user already exists', async () => {
      const signupDto = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0712345678',
        password: 'password123',
      };

      mockUserRepository.count.mockResolvedValue(1);

      await expect(service.signup(signupDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should authenticate user and return token', async () => {
      const loginDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0712345678',
        passwordHash,
        role: 'customer',
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('token', 'jwt-token');
      expect(result.user.email).toBe('john@example.com');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0712345678',
        passwordHash,
        role: 'customer',
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
