import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queues, getRedisConnectionConfig } from './queue.config';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: Queues.SCRIPT,
      useFactory: (configService: ConfigService) => ({
        connection: getRedisConnectionConfig(configService),
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 1000,
        },
      }),
    }),
  ],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}
