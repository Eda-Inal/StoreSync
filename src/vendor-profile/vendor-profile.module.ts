import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { VendorProfileController } from './vendor-profile.controller';
import { VendorProfileService } from './vendor-profile.service';

@Module({
  imports: [PrismaModule],
  controllers: [VendorProfileController],
  providers: [VendorProfileService],
})
export class VendorProfileModule {}








