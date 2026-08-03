import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ChangePhoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  @MinLength(9, { message: 'Nomor telepon minimal 9 karakter' })
  @MaxLength(20, { message: 'Nomor telepon maksimal 20 karakter' })
  phone: string;
}
