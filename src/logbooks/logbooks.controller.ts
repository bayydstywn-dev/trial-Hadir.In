import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { LogbooksService } from './logbooks.service';
import { CreateLogbookDto } from './dto/create-logbook.dto';
import { UpdateLogbookDto } from './dto/update-logbook.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('api/v1/logbooks')
@UseGuards(JwtAuthGuard)
export class LogbooksController {
    constructor(private readonly logbooksService: LogbooksService) { }

    // POST /api/v1/logbooks
    @Post()
    async create(@Request() req: any, @Body() dto: CreateLogbookDto) {
        return this.logbooksService.create(req.user.id, dto);
    }

    // GET /api/v1/logbooks/my-logbooks
    @Get('my-logbooks')
    async findMyLogbooks(@Request() req: any) {
        return this.logbooksService.findMyLogbooks(req.user.id);
    }

    // PUT /api/v1/logbooks/:id
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateLogbookDto,
    ) {
        return this.logbooksService.update(id, req.user.id, dto);
    }

    // DELETE /api/v1/logbooks/:id
    @Delete(':id')
    async remove(@Param('id') id: string, @Request() req: any) {
        return this.logbooksService.remove(id, req.user.id);
    }

    // GET /api/v1/logbooks/admin/all (Khusus Admin)
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get('admin/all')
    async findAllForAdmin(@Query('search') search?: string) {
        return this.logbooksService.findAllForAdmin(search);
    }
}