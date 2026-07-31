import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    // 1. Tambah User Baru
    async create(dto: CreateUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email sudah terdaftar');
        }

        // Gunakan password dari input DTO, atau pakai password default 'HadirIn123'
        const defaultPassword = dto.password || 'HadirIn123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const newUser = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                role: dto.role,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        return {
            message: 'User berhasil ditambahkan',
            user: newUser,
        };
    }

    // 2. Ambil Seluruh User (Support Filter & Search)
    async findAll(search?: string, role?: Role) {
        const whereCondition: any = {};

        if (role) {
            whereCondition.role = role;
        }

        if (search) {
            whereCondition.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const users = await this.prisma.user.findMany({
            where: whereCondition,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return users;
    }

    // 3. Reset Password Manual oleh Admin ke Default ('HadirIn123')
    async resetPassword(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User tidak ditemukan');

        const hashedPassword = await bcrypt.hash('HadirIn123', 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { message: 'Password user berhasil di-reset kembali ke HadirIn123' };
    }

    // 4. Toggle Status Aktif/Non-aktif User
    async toggleStatus(userId: string, isActive: boolean) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User tidak ditemukan');

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { isActive },
            select: { id: true, name: true, email: true, isActive: true },
        });

        return {
            message: `Status user berhasil diubah menjadi ${isActive ? 'Aktif' : 'Non-Aktif'}`,
            user: updatedUser,
        };
    }
    // 5. Ganti Password Mandiri
    async ChangePassword(userId: string, oldPassword: string, newPassword: string){
        // cari user berdasarkan ID
        const user = await this.prisma.user.findUnique ({where: {id:userId}});
        if (!user) throw new NotFoundException ('User tidak ditemukan');

        // Verifikasi Password Lama
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {throw new BadRequestException('Password Lama Salah');}

        // Validasi Password Baru Minimal 6 Karakter
        if (newPassword.length < 6) {
            throw new BadRequestException('Password baru harus minimal 6 karakter')
        }

        // Hash Password Baru
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update Password
        await this.prisma.user.update({
            where: {id:userId},
            data: {password: hashedNewPassword}
        });
        
        // Bersihkan token OTP yang mungkin aktif
        await this.prisma.otp.updateMany({
            where: {
                email: user.email,
                isUsed: false,
                expiredAt: { gt: new Date() }
            },
            data: { isUsed: true }
        })

        return {
            message: 'Password berhasil diubah. Silahkan login kembali.',
        };
    }

    // 6. Ganti Username Sendiri
async changeUsername(userId: string, name: string) {
    // Cari user
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new NotFoundException('User tidak ditemukan');
    }

    // Hilangkan spasi depan/belakang
    name = name.trim();

    // Validasi
    if (name.length < 3) {
        throw new BadRequestException(
            'Username minimal 3 karakter',
        );
    }

    // Jika sama
    if (user.name === name) {
        throw new BadRequestException(
            'Username baru tidak boleh sama dengan sebelumnya',
        );
    }

    // Cek apakah username sudah dipakai
    const existingUser = await this.prisma.user.findFirst({
        where: {
            name: {
                equals: name,
                mode: 'insensitive',
            },
            NOT: {
                id: userId,
            },
        },
    });

    if (existingUser) {
        throw new BadRequestException(
            'Username sudah digunakan'
        );
    }

    const updatedUser = await this.prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            name,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    return {
        message: 'Username berhasil diubah',
        user: updatedUser,
    };
}

    }
