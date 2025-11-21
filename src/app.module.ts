import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configurations from './config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { VendorModule } from './vendor/vendor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    VendorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
