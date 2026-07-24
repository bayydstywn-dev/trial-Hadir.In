import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class RequestOtpDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty()
    email: string;
}

export class VerifyOtpDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @Length(6, 6, { message: 'Kode OTP harus 6 digit' })
    code: string;
}

export class ResetPasswordDto {
    @IsEmail({}, { message: 'Format email tidak valid' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @Length(6, 6, { message: 'Kode OTP harus 6 digit' })
    code: string;

    @IsString()
    @MinLength(6, { message: 'Password minimal 6 karakter' })
    newPassword: string;
}