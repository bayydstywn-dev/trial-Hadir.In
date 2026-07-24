import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard) // Proteksi: Wajib Login & Wajib Role Admin
@Roles(Role.ADMIN)                   // Hanya Admin yang bisa akses seluruh controller ini
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // POST /api/v1/users
    @Post()
    async create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    // GET /api/v1/users?search=john&role=EMPLOYEE
    @Get()
    async findAll(@Query('search') search?: string, @Query('role') role?: Role) {
        return this.usersService.findAll(search, role);
    }

    // PATCH /api/v1/users/:id/reset-password
    @Patch(':id/reset-password')
    async resetPassword(@Param('id') id: string) {
        return this.usersService.resetPassword(id);
    }

    // PATCH /api/v1/users/:id/status
    @Patch(':id/status')
    async toggleStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.usersService.toggleStatus(id, isActive);
    }
}