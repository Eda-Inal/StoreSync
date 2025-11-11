import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configurations from './config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: configurations,
      envFilePath: '.env',
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
