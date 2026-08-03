import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeUsernameDto } from './dto/change-username.dto';
import { ChangePhoneDto } from './dto/change-phone.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/users')
@UseGuards(JwtAuthGuard, RolesGuard) // Proteksi: Wajib Login untuk semua route
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // POST /api/v1/users (Khusus Admin)
    @Post()
    @Roles(Role.ADMIN)
    async create(@Body() dto: CreateUserDto) {
        return this.usersService.create(dto);
    }

    // GET /api/v1/users?search=john&role=EMPLOYEE (Khusus Admin)
    @Get()
    @Roles(Role.ADMIN)
    async findAll(@Query('search') search?: string, @Query('role') role?: Role) {
        return this.usersService.findAll(search, role);
    }

    // PATCH /api/v1/users/:id/reset-password (Khusus Admin)
    @Patch(':id/reset-password')
    @Roles(Role.ADMIN)
    async resetPassword(@Param('id') id: string) {
        return this.usersService.resetPassword(id);
    }

    // PATCH /api/v1/users/:id/status (Khusus Admin)
    @Patch(':id/status')
    @Roles(Role.ADMIN)
    async toggleStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
        return this.usersService.toggleStatus(id, isActive);
    }

    // PATCH /api/v1/users/change-username
    @Patch('change-username')
    async changeUsername(
        @Req() req: any,
        @Body() dto: ChangeUsernameDto,
    ) {
        const userId = req.user.id;

        return this.usersService.changeUsername(
            userId,
            dto.name,
        );
    }

    // PATCH /api/v1/users/change-phone
    @Patch('change-phone')
    async changePhone(
        @Req() req: any,
        @Body() dto: ChangePhoneDto,
    ) {
        const userId = req.user.id;

        return this.usersService.changePhone(
            userId,
            dto.phone,
        );
    }

    // PATCH /api/v1/users/change-email
    @Patch('change-email')
    async changeEmail(
        @Req() req: any,
        @Body() dto: ChangeEmailDto,
    ) {
        const userId = req.user.id;

        return this.usersService.changeEmail(
            userId,
            dto.email,
        );
    }

    // PATCH /api/v1/users/change-password (Bisa diakses Semua User yang Logged-in)
    @Patch('change-password')
    async ChangePassword(
        @Req() req: any, 
        @Body() dto: ChangePasswordDto,
    ) {
        // req.user didapat dari JwtStrategy setelah token diverifikasi
        const userId = req.user.id; 

        return this.usersService.ChangePassword(
            userId,
            dto.oldPassword,
            dto.newPassword,
        );
    }
}