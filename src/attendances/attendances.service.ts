import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus } from '@prisma/client';
import * as Workbook from 'exceljs';
import { Response } from 'express';

@Injectable()
export class AttendancesService {
    constructor(private prisma: PrismaService) { }

    // Helper untuk mendapatkan tanggal hari ini (Tanpa Jam / 00:00:00)
    private getTodayDate(): Date {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }

    // 1. Cek Status Absensi Hari Ini
    async getTodayAttendance(userId: string) {
        const today = this.getTodayDate();

        const attendance = await this.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
        });

        return {
            today,
            attendance: attendance || null,
        };
    }

    // 2. Clock-In (Absen Masuk)
    async clockIn(userId: string) {
        const today = this.getTodayDate();
        const now = new Date();

        // Cek apakah sudah pernah clock-in hari ini
        const existing = await this.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Anda sudah melakukan Clock-In hari ini');
        }

        // Penentuan Status Terlambat (Misal: Batas jam masuk adalah 08:00:00)
        const workStart = new Date();
        workStart.setHours(8, 0, 0, 0);

        const status: AttendanceStatus =
            now > workStart ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

        const attendance = await this.prisma.attendance.create({
            data: {
                userId,
                date: today,
                clockIn: now,
                status,
            },
        });

        return {
            message: 'Clock-In berhasil',
            attendance,
        };
    }

    // 3. Clock-Out (Absen Keluar)
    async clockOut(userId: string) {
        const today = this.getTodayDate();
        const now = new Date();

        const existing = await this.prisma.attendance.findUnique({
            where: {
                userId_date: {
                    userId,
                    date: today,
                },
            },
        });

        if (!existing) {
            throw new BadRequestException('Anda belum melakukan Clock-In hari ini');
        }

        if (existing.clockOut) {
            throw new BadRequestException('Anda sudah melakukan Clock-Out hari ini');
        }

        const attendance = await this.prisma.attendance.update({
            where: { id: existing.id },
            data: { clockOut: now },
        });

        return {
            message: 'Clock-Out berhasil',
            attendance,
        };
    }

    // 4. Riwayat Absen Saya (Berdasarkan Bulan & Tahun)
    async getMyHistory(userId: string, month?: string, year?: string) {
        const targetYear = year ? parseInt(year) : new Date().getFullYear();
        const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // Month 0-indexed

        const startDate = new Date(targetYear, targetMonth, 1);
        const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

        const history = await this.prisma.attendance.findMany({
            where: {
                userId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: { date: 'desc' },
        });

        return history;
    }

    // 5. Admin: Lihat Seluruh Presensi Karyawan
    async getAllAttendances(search?: string, date?: string) {
        const whereCondition: any = {};

        if (date) {
            const filterDate = new Date(date);
            filterDate.setHours(0, 0, 0, 0);
            whereCondition.date = filterDate;
        }

        if (search) {
            whereCondition.user = {
                name: { contains: search, mode: 'insensitive' },
            };
        }

        const attendances = await this.prisma.attendance.findMany({
            where: whereCondition,
            include: {
                user: {
                    select: { id: true, name: true, email: true, role: true },
                },
            },
            orderBy: { date: 'desc' },
        });

        return attendances;
    }

    //Untuk export Excel
    async exportExcel(res: Response) {
        const attendances = await this.prisma.attendance.findMany({
            include: {
                user: { select: { name: true, email: true, role: true } },
            },
            orderBy: { date: 'desc' },
        });

        const workbook = new Workbook.Workbook();
        const worksheet = workbook.addWorksheet('Rekap Absensi');

        // Format Header Kolom
        worksheet.columns = [
            { header: 'Nama Pegawai', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Role', key: 'role', width: 15 },
            { header: 'Tanggal', key: 'date', width: 15 },
            { header: 'Jam Masuk', key: 'clockIn', width: 20 },
            { header: 'Jam Keluar', key: 'clockOut', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
        ];

        // Masukkan Data
        attendances.forEach((item) => {
            worksheet.addRow({
                name: item.user.name,
                email: item.user.email,
                role: item.user.role,
                date: item.date.toISOString().split('T')[0],
                clockIn: item.clockIn ? new Date(item.clockIn).toLocaleTimeString('id-ID') : '-',
                clockOut: item.clockOut ? new Date(item.clockOut).toLocaleTimeString('id-ID') : '-',
                status: item.status,
            });
        });

        // Set Header HTTP Response untuk Download File Excel
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=' + `Rekap_Absensi_${Date.now()}.xlsx`,
        );

        await workbook.xlsx.write(res);
        res.end();
    }
}