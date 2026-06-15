import { Controller, Post, Body, Res, Get, Req, UseGuards, Put, Delete, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(
    @Body() signupDto: any,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.signup(signupDto);
    
    // Set HTTP-only SameSite=Strict cookie for secure JWT transport
    response.cookie('sm_token', result.token, {
      httpOnly: true,
      secure: false, // In production, this should be true (requires HTTPS)
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return result;
  }

  @Post('login')
  async login(
    @Body() loginDto: any,
    @Res({ passthrough: true }) response: Response
  ) {
    const result = await this.authService.login(loginDto);
    
    // Set HTTP-only SameSite=Strict cookie for secure JWT transport
    response.cookie('sm_token', result.token, {
      httpOnly: true,
      secure: false, // In production, this should be true (requires HTTPS)
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return result;
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    return {
      id: req.user.sub,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    };
  }

  @Get('users')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async findAllUsers() {
    return this.authService.findAllUsers();
  }

  @Post('users')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async createUser(@Body() createUserDto: any) {
    return this.authService.createUser(createUserDto);
  }

  @Put('users/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async updateUser(@Param('id') id: string, @Body() updateDto: any) {
    return this.authService.updateUser(id, updateDto);
  }

  @Delete('users/:id')
  @UseGuards(AuthGuard)
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('sm_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/'
    });
    return { success: true, message: 'Logged out successfully.' };
  }
}
