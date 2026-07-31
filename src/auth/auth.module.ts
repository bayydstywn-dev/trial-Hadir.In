import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
    imports: [
        ConfigModule,

        PassportModule,

        JwtModule.registerAsync({
            imports: [ConfigModule],

            inject: [ConfigService],

            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),

                signOptions: {
                    expiresIn: '3d',
                },
            }),
        }),

        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                transport: {
                    host: configService.get<string>('MAIL_HOST'),
                    port: configService.get<number>('MAIL_PORT'),
                    auth: {
                        user: configService.get<string>('MAIL_USER'),
                        pass: configService.get<string>('MAIL_PASS'),
                    }
                },
                defaults: {
                    from: configService.get<string>('MAIL_FROM'),
                },
            }),
        }),
    ],

    controllers: [
        AuthController,
    ],

    providers: [
        AuthService,
        JwtStrategy,
    ],

    exports: [
        AuthService,
    ],
})
export class AuthModule { }