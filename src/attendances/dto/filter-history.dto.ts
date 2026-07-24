import { IsOptional, IsString } from 'class-validator';

export class FilterHistoryDto {
    @IsOptional()
    @IsString()
    month?: string; // Format "1" sampai "12"

    @IsOptional()
    @IsString()
    year?: string;  // Contoh "2026"
}