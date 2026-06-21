import { Controller, Post, Body, Res, Get, Req, UseGuards, Put, Delete, Param, Query } from '@nestjs/common';
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
    
    if ((result as any).token) {
      // Set HTTP-only SameSite=Strict cookie for secure JWT transport
      response.cookie('sm_token', (result as any).token, {
        httpOnly: true,
        secure: false, // In production, this should be true (requires HTTPS)
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/'
      });
    }

    return result;
  }

  @Get('verify')
  async verifyEmail(
    @Query('token') token: string,
    @Res() response: Response
  ) {
    await this.authService.verifyEmail(token);
    response.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Verified - Sportman.ke</title>
          <style>
            body { font-family: 'Outfit', sans-serif; background-color: #080B11; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background-color: #0D1321; border: 1px solid #1E293B; padding: 40px; border-radius: 24px; text-align: center; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
            h1 { color: #FF5A1F; font-size: 24px; margin-bottom: 16px; font-weight: 950; text-transform: uppercase; }
            p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
            .btn { display: inline-block; background: linear-gradient(135deg, #FF5A1F 0%, #EF4444 100%); color: white; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 850; font-size: 13px; text-transform: uppercase; transition: all 0.2s ease; }
            .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255, 90, 31, 0.2); }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>✓ Email Verified</h1>
            <p>Your email address has been successfully verified. You can now close this window and log in to your account.</p>
            <a href="http://localhost:5173/login" class="btn">Go to Login</a>
          </div>
        </body>
      </html>
    `);
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
