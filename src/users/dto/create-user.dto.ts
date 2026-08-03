import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Nomor telepon harus berupa teks' })
  @MinLength(9, { message: 'Nomor telepon minimal 9 karakter' })
  @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
  phone?: string;

  @IsEnum(Role, { message: 'Role harus ADMIN, EMPLOYEE, atau INTERN' })
  role: Role;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password?: string; // Jika tidak diisi, nanti dijadikan password default
}