import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogbookDto } from './dto/create-logbook.dto';
import { UpdateLogbookDto } from './dto/update-logbook.dto';

@Injectable()
export class LogbooksService {
    constructor(private prisma: PrismaService) { }

    // 1. Buat Logbook Baru
    async create(userId: string, dto: CreateLogbookDto) {
        const logbook = await this.prisma.logbook.create({
            data: {
                userId,
                date: new Date(dto.date),
                title: dto.title,
                description: dto.description,
            },
        });

        return {
            message: 'Logbook berhasil dibuat',
            logbook,
        };
    }

    // 2. Ambil Daftar Logbook Milik Sendiri
    async findMyLogbooks(userId: string) {
        return this.prisma.logbook.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
    }

    // 3. Edit Logbook Milik Sendiri
    async update(id: string, userId: string, dto: UpdateLogbookDto) {
        const logbook = await this.prisma.logbook.findUnique({ where: { id } });

        if (!logbook) throw new NotFoundException('Logbook tidak ditemukan');
        if (logbook.userId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah logbook ini');
        }

        const updated = await this.prisma.logbook.update({
            where: { id },
            data: {
                ...(dto.date && { date: new Date(dto.date) }),
                ...(dto.title && { title: dto.title }),
                ...(dto.description && { description: dto.description }),
            },
        });

        return { message: 'Logbook berhasil diperbarui', logbook: updated };
    }

    // 4. Hapus Logbook Milik Sendiri
    async remove(id: string, userId: string) {
        const logbook = await this.prisma.logbook.findUnique({ where: { id } });

        if (!logbook) throw new NotFoundException('Logbook tidak ditemukan');
        if (logbook.userId !== userId) {
            throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus logbook ini');
        }

        await this.prisma.logbook.delete({ where: { id } });
        return { message: 'Logbook berhasil dihapus' };
    }

    // 5. Admin: Lihat Seluruh Logbook Karyawan/Magang
    async findAllForAdmin(search?: string) {
        const whereCondition: any = {};

        if (search) {
            whereCondition.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        return this.prisma.logbook.findMany({
            where: whereCondition,
            include: {
                user: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { date: 'desc' },
        });
    }
}