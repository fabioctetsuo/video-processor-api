import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MockRabbitMQService } from '../infrastructure/services/__mocks__/rabbitmq.service';
import { RabbitMQService } from '../infrastructure/services/rabbitmq.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RabbitMQService,
      useClass: MockRabbitMQService,
    },
  ],
  exports: [RabbitMQService],
})
export class TestMessagingModule {}
