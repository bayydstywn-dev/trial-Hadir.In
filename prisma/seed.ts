import 'dotenv/config';
import { PrismaClient, Role } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@hadirin.com' },
        update: {},
        create: {
            email: 'admin@hadirin.com',
            name: 'Super Admin HR',
            password: hashedPassword,
            role: Role.ADMIN,
            isActive: true,
        },
    });

    console.log('Seed berhasil! Admin default dibuat:', admin.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });