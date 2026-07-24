import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendancesModule } from './attendances/attendances.module';
import { LogbooksModule } from './logbooks/logbooks.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AttendancesModule,
    LogbooksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }