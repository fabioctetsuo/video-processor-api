import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PresentationModule } from './presentation/presentation.module';
import { MessagingModule } from './infrastructure/messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '10'),
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'outputs'),
      serveRoot: '/static',
    }),
    MessagingModule,
    PresentationModule,
  ],
})
export class AppModule {}
