import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async signup(signupDto: any) {
    const { name, email, phone, password } = signupDto;

    const count = await this.userRepository.count({ where: { email } });
    if (count > 0) {
      throw new BadRequestException('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = this.userRepository.create({
      name,
      email,
      phone,
      passwordHash,
      role: 'customer', // Force all public signups to 'customer' role
      isVerified: false,
      verificationToken,
      createdAt: new Date().toISOString()
    });

    const savedUser = await this.userRepository.save(user);
    
    // Send verification email using MailService (falls back to simulation log if not configured)
    await this.mailService.sendVerificationEmail(email, name, verificationToken);

    return {
      message: 'Registration successful. Please verify your email before signing in.',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        phone: savedUser.phone,
        role: savedUser.role,
      }
    };
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid login credentials.');
    }

    // Verify email status before allowing login
    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before signing in.');
    }

    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is missing.');
    }

    const user = await this.userRepository.findOne({ where: { verificationToken: token } });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    user.isVerified = true;
    user.verificationToken = null;
    await this.userRepository.save(user);
    return { success: true };
  }

  async findAllUsers() {
    const users = await this.userRepository.find();
    return users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  async createUser(createUserDto: any) {
    const { name, email, phone, password, role } = createUserDto;

    const count = await this.userRepository.count({ where: { email } });
    if (count > 0) {
      throw new BadRequestException('User with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      name,
      email,
      phone,
      passwordHash,
      role: role || 'customer',
    });

    const savedUser = await this.userRepository.save(user);
    const { passwordHash: _, ...safeUser } = savedUser;
    return safeUser;
  }

  async updateUser(id: string, updateDto: any) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const { name, email, phone, password, role } = updateDto;

    if (email && email !== user.email) {
      const count = await this.userRepository.count({ where: { email } });
      if (count > 0) {
        throw new BadRequestException('User with this email already exists.');
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role;

    if (password && password.trim() !== '') {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    const savedUser = await this.userRepository.save(user);
    const { passwordHash: _, ...safeUser } = savedUser;
    return safeUser;
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }
    await this.userRepository.remove(user);
    return { success: true };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role, phone: user.phone, name: user.name };
    return this.jwtService.sign(payload);
  }
}

