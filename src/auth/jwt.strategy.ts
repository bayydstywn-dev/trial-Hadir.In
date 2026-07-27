import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {

        const jwtSecret = configService.get<string>('JWT_SECRET');

        if (!jwtSecret) {
            throw new Error(
                'JWT_SECRET belum ditemukan di .env'
            );
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            ignoreExpiration: false,

            secretOrKey: jwtSecret,
        });


        console.log('====================================');
        console.log('JWT Strategy Loaded');
        console.log('JWT_SECRET =', jwtSecret);
        console.log('====================================');
    }


    async validate(payload: {
        sub: string;
        email: string;
        role: string;
    }) {

        console.log('========== JWT VALIDATE ==========');
        console.log('Payload:', payload);


        const user = await this.prisma.user.findUnique({
            where: {
                id: payload.sub,
            },
        });


        console.log(
            'User ditemukan:',
            !!user
        );


        if (!user) {
            throw new UnauthorizedException(
                'User tidak ditemukan'
            );
        }


        if (!user.isActive) {
            throw new UnauthorizedException(
                'User tidak aktif'
            );
        }


        console.log('JWT BERHASIL');


        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
}