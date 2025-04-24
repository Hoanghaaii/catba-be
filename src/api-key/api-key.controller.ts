import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/rbac/guards/roles.guard';
import { RBAC } from 'src/common/rbac/rbac.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { BulkCreateApiKeyDto, CreateApiKeyDto } from './dto/apiKey.dto';
import { ROLES } from 'src/common/constants';
import { User } from 'src/user/schemas/user.schema';

@Controller('api-key')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'apiKey', 'own')
  async create(@Body() dto: CreateApiKeyDto, @CurrentUser() user: User) {
    return this.apiKeyService.create(dto, user);
  }

  @Post('bulk') // Endpoint mới để tạo nhiều API key
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RBAC('create', 'apiKey', 'own')
  async bulkCreate(
    @Body() dto: BulkCreateApiKeyDto,
    @CurrentUser() user: User,
  ) {
    return this.apiKeyService.bulkCreate(dto.apiKeys, user);
  }
}
