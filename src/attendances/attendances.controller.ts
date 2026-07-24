import {
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import * as express from 'express';
import { AttendancesService } from './attendances.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { FilterHistoryDto } from './dto/filter-history.dto';
import { Res } from '@nestjs/common';


@Controller('api/v1/attendances')
@UseGuards(JwtAuthGuard) // Semua endpoint absensi wajib menyertakan token JWT
export class AttendancesController {
    constructor(private readonly attendancesService: AttendancesService) { }

    // GET /api/v1/attendances/today
    @Get('today')
    async getTodayStatus(@Request() req: any) {
        return this.attendancesService.getTodayAttendance(req.user.id);
    }

    // POST /api/v1/attendances/clock-in
    @Post('clock-in')
    async clockIn(@Request() req: any) {
        return this.attendancesService.clockIn(req.user.id);
    }

    // POST /api/v1/attendances/clock-out
    @Post('clock-out')
    async clockOut(@Request() req: any) {
        return this.attendancesService.clockOut(req.user.id);
    }

    // GET /api/v1/attendances/my-history
    @Get('my-history')
    async getMyHistory(@Request() req: any, @Query() query: FilterHistoryDto) {
        return this.attendancesService.getMyHistory(
            req.user.id,
            query.month,
            query.year,
        );
    }

    // GET /api/v1/attendances/admin/all (Khusus Admin)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/all')
    async getAllAttendances(
        @Query('search') search?: string,
        @Query('date') date?: string,
    ) {
        return this.attendancesService.getAllAttendances(search, date);
    }

    // GET /api/v1/attendances/export-excel
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/export-excel')
    async exportExcel(@Res() res: express.Response) {
        return this.attendancesService.exportExcel(res);
    }
}