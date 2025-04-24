import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/rbac/guards/roles.guard';
import { AiService } from './ai.service';
import { CreateAIModelDto, UpdateAIModelDto } from './dto/ai.dto';

@Controller('ai-models')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiModelService: AiService) {}

  @Post()
  async create(@Body() createAIModelDto: CreateAIModelDto) {
    return this.aiModelService.create(createAIModelDto);
  }

  @Get()
  async findAll() {
    return this.aiModelService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.aiModelService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAIModelDto: UpdateAIModelDto,
  ) {
    return this.aiModelService.update(id, updateAIModelDto);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Query('status') status: string) {
    const booleanStatus = status === 'true' || status === '1';
    return this.aiModelService.updateStatus(id, booleanStatus);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.aiModelService.remove(id);
  }
}
