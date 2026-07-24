import {
    Controller,
    Post,
    Get,
    Patch,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
    RequestOtpDto,
    VerifyOtpDto,
    ResetPasswordDto,
} from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // POST /api/v1/auth/login
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // POST /api/v1/auth/forgot-password/request (Public)
    @Post('forgot-password/request')
    async requestOtp(@Body() dto: RequestOtpDto) {
        return this.authService.requestOtp(dto);
    }

    // POST /api/v1/auth/forgot-password/verify (Public)
    @Post('forgot-password/verify')
    async verifyOtp(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOtp(dto);
    }

    // POST /api/v1/auth/forgot-password/reset (Public)
    @Post('forgot-password/reset')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }

    // GET /api/v1/auth/me (Protected - Membutuhkan Token)
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return {
            user: req.user,
        };
    }

    // PATCH /api/v1/auth/change-password (Protected - Membutuhkan Token)
    @UseGuards(JwtAuthGuard)
    @Patch('change-password')
    async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        return this.authService.changePassword(req.user.id, dto);
    }
}