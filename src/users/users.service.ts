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
}