import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            // 1. Ambil token JWT dari Header: Authorization Bearer <token>
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            // 2. Kunci rahasia untuk membaca token (diambil dari .env)
            secretOrKey: process.env.JWT_SECRET || 'secretKey',
        });
    }

    // 3. Fungsi ini otomatis dipanggil jika token valid
    async validate(payload: { sub: string; email: string; role: string }) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user || !user.isActive) {
            throw new UnauthorizedException('Akun tidak ditemukan atau tidak aktif');
        }

        // Mengembalikan data user yang akan ditempel di request (req.user)
        return { id: user.id, email: user.email, name: user.name, role: user.role };
    }
}