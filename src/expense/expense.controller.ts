import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
} from './dto/expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/rbac/guards/roles.guard';
import { RBAC } from '../common/rbac/rbac.decorator';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  @RBAC('create', 'expense', 'any')
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expenseService.create(createExpenseDto);
  }

  @Get()
  @RBAC('read', 'expense', 'any')
  findAll(@Query() query: ExpenseQueryDto) {
    return this.expenseService.findAll(query);
  }

  @Get('summary')
  @RBAC('read', 'expense', 'any')
  getSummary() {
    return this.expenseService.getSummary();
  }

  @Get(':id')
  @RBAC('read', 'expense', 'any')
  findOne(@Param('id') id: string) {
    return this.expenseService.findById(id);
  }

  @Patch(':id')
  @RBAC('update', 'expense', 'any')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expenseService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  @RBAC('delete', 'expense', 'any')
  remove(@Param('id') id: string) {
    return this.expenseService.remove(id);
  }
}
