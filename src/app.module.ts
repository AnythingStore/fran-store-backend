import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PrismaService } from './prisma.service';

@Module({
  imports: [AuthModule, UserModule, 
   
    CacheModule.register({
      isGlobal: true, // Hacer el módulo de caché global 
      ttl: 1000*60*60*24, // Tiempo de vida en segundos
      max: 100
    }),
   
    ConfigModule.forRoot({
      isGlobal: true, // Hace que el módulo de configuración esté disponible globalmente
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 60,
    }]),
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
