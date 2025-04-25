import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExpenseService } from './expense.service';
import { ExpenseController } from './expense.controller';
import { Expense, ExpenseSchema } from './schemas/expense.schema';
import { AccessControl } from 'accesscontrol';
import { accessControl } from '../common/access-control';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Expense.name, schema: ExpenseSchema }]),
  ],
  controllers: [ExpenseController],
  providers: [
    ExpenseService,
    {
      provide: AccessControl,
      useValue: accessControl,
    },
  ],
  exports: [ExpenseService],
})
export class ExpenseModule {}
