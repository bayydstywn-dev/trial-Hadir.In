import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class CreateLogbookDto {
    @IsDateString({}, { message: 'Format tanggal tidak valid (harus YYYY-MM-DD)' })
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsNotEmpty({ message: 'Judul kegiatan tidak boleh kosong' })
    title: string;

    @IsString()
    @IsNotEmpty({ message: 'Deskripsi tidak boleh kosong' })
    description: string;
}