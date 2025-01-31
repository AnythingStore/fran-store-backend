// prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Global()
@Module({
  providers: [
    {
      provide: PrismaClient,
      useFactory: () => {
        const prisma = new PrismaClient({
          datasources: {
            db: {
              url: 'DATABASE_URL', // Reemplaza con tu URL de base de datos
            },
          },
          log: ['query', 'info', 'warn', 'error'],
        });

        // Configura el tiempo de espera global para las transacciones
        prisma.$use(async (params, next) => {
          if (params.action === 'executeRaw' || params.action === 'queryRaw') {
            params.args.timeout = 10000; // Tiempo de espera en milisegundos (10 segundos en este caso)
          }
          return next(params);
        });

        return prisma;
      },
    },
  ],
  exports: [PrismaClient],
})
export class PrismaModule {}