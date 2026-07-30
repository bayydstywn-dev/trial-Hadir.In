import { Module } from '@nestjs/common';
import { LogbooksController } from './logbooks.controller';
import { LogbooksService } from './logbooks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LogbooksController],
  providers: [LogbooksService],
})
export class LogbooksModule {}