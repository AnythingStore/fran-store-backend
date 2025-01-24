import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';

@Module({
  imports: [],
  providers: [UserService, PrismaService, JwtStrategy],
  exports: [UserService]
})
export class UserModule { }
