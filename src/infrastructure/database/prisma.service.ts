import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    console.log('🗄️  Connecting to video PostgreSQL database...');
    await this.$connect();
    console.log('🗄️  Connected to video PostgreSQL database');
  }

  async onModuleDestroy() {
    console.log('🗄️  Disconnecting from video PostgreSQL database...');
    await this.$disconnect();
    console.log('🗄️  Disconnected from video PostgreSQL database');
  }
}
