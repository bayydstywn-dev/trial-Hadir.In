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
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailerService: MailerService
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

        await this.mailerService.sendMail({
            to: dto.email,
            subject: 'Kode OTP Lupa Password - Hadir.In',
            html: ` <div style="background-color: #f6f9fc; padding: 40px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333333; line-height: 1.6;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f5;">
            
            <!-- Header/Logo Banner -->
            <div style="background: linear-gradient(135deg, #2E5090 0%, #1A365D 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">Hadir.In</h1>
                <p style="color: #e2e8f0; margin: 5px 0 0 0; font-size: 14px;">Sistem Absensi & Kehadiran Digital</p>
            </div>
            <!-- Content Area -->
            <div style="padding: 30px 25px;">
                <h2 style="color: #1a202c; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 15px;">Permintaan Reset Password</h2>
                <p style="font-size: 15px; color: #4a5568; margin-bottom: 20px;">
                    Halo, <br>Kami menerima permintaan untuk mereset kata sandi akun <strong>Hadir.In</strong> Anda. Gunakan kode keamanan di bawah ini untuk melanjutkan proses reset password:
                </p>
                <!-- OTP Display Box -->
                <div style="background: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
                    <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #718096; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">KODE KEAMANAN (OTP)</span>
                    <strong style="font-size: 32px; letter-spacing: 6px; color: #2E5090; font-family: monospace; display: inline-block;">${code}</strong>
                </div>
                <p style="font-size: 14px; color: #e53e3e; font-weight: 500; margin-top: 10px;">
                    ⚠️ Kode OTP ini bersifat rahasia dan hanya berlaku selama <strong>5 menit</strong>.
                </p>
                
                <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 25px 0;">
                <p style="font-size: 13px; color: #718096; margin-bottom: 0;">
                    Jika Anda tidak melakukan permintaan ini, Anda dapat mengabaikan email ini dengan aman. Password Anda tidak akan berubah sampai Anda menyelesaikan proses ini.
                </p>
            </div>
            <!-- Footer -->
            <div style="background-color: #fafbfd; padding: 20px; text-align: center; border-top: 1px solid #eef2f5;">
                <p style="font-size: 12px; color: #a0aec0; margin: 0 0 5px 0;">&copy; ${new Date().getFullYear()} Hadir.In. All rights reserved.</p>
                <p style="font-size: 11px; color: #cbd5e0; margin: 0;">Email otomatis, mohon tidak membalas email ini.</p>
            </div>
        </div>
    </div>
`,
        }),

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