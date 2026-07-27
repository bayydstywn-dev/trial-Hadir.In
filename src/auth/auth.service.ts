import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import {
    RequestOtpDto,
    VerifyOtpDto,
    ResetPasswordDto,
} from './dto/forgot-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    // 1. LOGIN
async login(dto: LoginDto) {
    console.log('=== LOGIN REQUEST ===');
    console.log('Email:', dto.email);

    const user = await this.prisma.user.findUnique({
        where: { email: dto.email },
    });

    console.log('User ditemukan:', !!user);

    if (!user) {
        throw new UnauthorizedException('Email atau password salah');
    }

    console.log('Email di DB:', user.email);
    console.log('isActive:', user.isActive);
    console.log('Password hash di DB:', user.password);

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
        throw new UnauthorizedException('Email atau password salah');
    }

    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
        message: 'Login berhasil',
        accessToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
}

    // 2. REQUEST OTP (Lupa Password)
    async requestOtp(dto: RequestOtpDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new NotFoundException('User dengan email tersebut tidak ditemukan');
        }

        // Generate 6 Digit Kode OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiredAt = new Date(Date.now() + 5 * 60 * 1000); // Masa berlaku 5 menit

        // Simpan ke database otps
        await this.prisma.otp.create({
            data: {
                email: dto.email,
                code,
                expiredAt,
            },
        });

        // TODO: Panggil MailerService untuk kirim email nyata (Nanti dikonfigurasi)
        console.log(`[DEVELOPMENT OTP] Kode OTP untuk ${dto.email} adalah: ${code}`);

        return { message: 'Kode OTP berhasil dikirim ke email Anda' };
    }

    // 3. VERIFY OTP
    async verifyOtp(dto: VerifyOtpDto) {
        const otp = await this.prisma.otp.findFirst({
            where: {
                email: dto.email,
                code: dto.code,
                isUsed: false,
                expiredAt: { gt: new Date() }, // Belum expired
            },
        });

        if (!otp) {
            throw new BadRequestException('Kode OTP salah atau sudah kedaluwarsa');
        }

        return { message: 'Kode OTP valid' };
    }

    // 4. RESET PASSWORD VIA OTP
    async resetPassword(dto: ResetPasswordDto) {
        // Verifikasi ulang OTP
        const otp = await this.prisma.otp.findFirst({
            where: {
                email: dto.email,
                code: dto.code,
                isUsed: false,
                expiredAt: { gt: new Date() },
            },
        });

        if (!otp) {
            throw new BadRequestException('Kode OTP salah atau sudah kedaluwarsa');
        }

        // Hash password baru
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

        // Update password user & tandai OTP sudah dipakai (isUsed: true)
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { email: dto.email },
                data: { password: hashedPassword },
            }),
            this.prisma.otp.update({
                where: { id: otp.id },
                data: { isUsed: true },
            }),
        ]);

        return { message: 'Password berhasil diperbarui, silakan login kembali' };
    }

    // 5. CHANGE PASSWORD (Ganti Password Mandiri)
    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User tidak ditemukan');
        }

        const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestException('Password lama Anda salah');
        }

        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password berhasil diubah' };
    }
}