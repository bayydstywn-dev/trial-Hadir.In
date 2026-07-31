import 'dotenv/config'
import { PrismaClient, Role, AttendanceStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Memulai proses Seeding Dummy Data ke DB Hadir.In')

    // Membuat Password Default
    const defaultPassword = await bcrypt.hash('admin123', 10);

    // membuat Akun Admin
    const admin = await prisma.user.upsert({
        where: { email: 'admin@hadirin.com' },
        update: {},
        create: {
            name: 'Super Admin HR',
            email: 'admin@hadirin.com',
            password: defaultPassword,
            role: Role.ADMIN,
            isActive: true,
        }
    });

    // membuat akun Karyawan
    const employee = await prisma.user.upsert({
        where: { email: 'bayu-adi@hadirin.com' },
        update: {},
        create: {
            name: 'Bayu Adi Setyawan',
            email: 'bayu-adi@hadirin.com',
            password: defaultPassword,
            role: Role.EMPLOYEE,
            isActive: true,
        },
    });

    // membuat akun Magang
    const intern = await prisma.user.upsert({
        where: { email: 'farelmuh@hadirin.com' },
        update: {},
        create: {
            name: 'Muhammad Farel',
            email: 'farelmuh@hadirin.com',
            password: defaultPassword,
            role: Role.EMPLOYEE,
            isActive: true,
        },
    });

    // memberikan pemberitahuan di console log bahwa proses seeding sukses
    console.log('✅ Data Dummy berhasil ditambahkan : ');
    console.log(`- Admin : ${admin.email}`);
    console.log(`- Karyawan : ${employee.email}`);
    console.log(`- Magang : ${intern.email}`);
    console.log('✅ Proses Seeding selesai');

    // membuat seed kehadiran dan logbook untuk Intern dan Karyawan (7 hari terakhir)
    const targetUsers = [employee, intern];
    const today = new Date();

    for (const user of targetUsers) {
        for (let i = 0; i < 7; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() - i);

            // melewati hari libur akhir pekan (sabtu dan ahad)
            if (targetDate.getDay() === 0 || targetDate.getDay() === 6) continue;

            const isLate = i === 1; // hari pertama dibuat terlambat
            const clockIn = new Date(targetDate);
            clockIn.setHours(isLate ? 9 : 9, isLate ? 45 : 0, 0);

            const clockOut = new Date(targetDate);
            clockOut.setHours(17, 0, 0);

            const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

            // Upsert Attendance (Cegah error unique constraint @@unique([userId, date]))
            await prisma.attendance.upsert({
                where: {
                    userId_date: {
                        userId: user.id,
                        date: targetDate,
                    },
                },

                update: {},
                create: {
                    userId: user.id,
                    date: targetDate,
                    clockIn: clockIn,
                    clockOut: clockOut,
                    status: status,
                },
            });

            // Membuat logbook (1 logbook per user)
            await prisma.logbook.create({
                data: {
                    userId: user.id,
                    date: targetDate,
                    title: `Logbook untuk ${user.name}`,
                    description: `Deskripsi untuk ${user.name}`,
                },
            });

        }
    }

    console.log('✅ Data Kehadiran dan Logbook berhasil ditambahkan');

    // membuat seep untuk sample kode OTP (exp 5menit)
    await prisma.otp.create({
        data: {
            email: 'bayu-adi@hadirin.com',
            code: '123456',
            expiredAt: new Date(Date.now() + 5 * 60 * 1000),
            isUsed: false,
        },
    });

    console.log('✅ Sample OTP berhasil ditambahkan');
    console.log('🎉 Alhamdulillah, Proses Seeding Selesai Tanpa Hambatan 🎉')
}

main().catch(e => {
    console.error('Aduuuh gustii! SEEDING GAGAL PARAH BOSS!', e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});

