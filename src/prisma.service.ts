import { OnModuleInit, Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit{
  async onModuleInit() {
    await this.$connect();
  }
  // async onModuleDestroy() {
  //   await this.$disconnect();
  // }
  async isConnected(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      console.log('database connection established');
      return true;
    }catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  }
}