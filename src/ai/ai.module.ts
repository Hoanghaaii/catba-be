import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AIModel, AIModelSchema } from './schemas/ai.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AIModel.name, schema: AIModelSchema }]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
