import * as XLSX from 'xlsx';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument, MemberType } from './schemas/expense.schema';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
} from './dto/expense.dto';
import { formatMongooseDoc, formatMongooseDocs } from '../common/utils';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>,
  ) {}

  /**
   * Create a new expense
   * @param createExpenseDto Expense data
   * @returns Created expense
   */
  async create(createExpenseDto: CreateExpenseDto): Promise<Expense> {
    try {
      // Validate that paidBy is in participants
      if (!createExpenseDto.participants.includes(createExpenseDto.paidBy)) {
        throw new BadRequestException(
          'Người thanh toán phải là một trong những người tham gia',
        );
      }

      // Create new expense
      const newExpense = new this.expenseModel(createExpenseDto);

      // Save expense
      const savedExpense = await newExpense.save();
      return savedExpense;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Không thể tạo chi phí: ${error.message}`);
    }
  }

  /**
   * Find all expenses
   * @param query Query parameters
   * @returns List of expenses
   */
  async findAll(query: ExpenseQueryDto = {}): Promise<any[]> {
    try {
      // Build query
      const queryConditions: any = {};

      if (query.isActive !== undefined) {
        queryConditions.isActive = query.isActive;
      }

      if (query.paidBy) {
        queryConditions.paidBy = query.paidBy;
      }

      if (query.search) {
        queryConditions.description = { $regex: query.search, $options: 'i' };
      }

      // Execute query
      const expenses = await this.expenseModel
        .find(queryConditions)
        .sort({ createdAt: -1 })
        .exec();

      // Format results
      return formatMongooseDocs(expenses);
    } catch (error) {
      throw new BadRequestException('Không thể lấy danh sách chi phí');
    }
  }

  /**
   * Find expense by id
   * @param id Expense id
   * @returns Expense
   */
  async findById(id: string): Promise<Expense> {
    try {
      const expense = await this.expenseModel.findById(id).exec();

      if (!expense) {
        throw new NotFoundException(`Không tìm thấy chi phí với id ${id}`);
      }

      return expense;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy thông tin chi phí');
    }
  }

  /**
   * Update expense
   * @param id Expense id
   * @param updateExpenseDto Update data
   * @returns Updated expense
   */
  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
  ): Promise<Expense> {
    try {
      // Check if expense exists
      const expense = await this.expenseModel.findById(id).exec();
      if (!expense) {
        throw new NotFoundException(`Không tìm thấy chi phí với id ${id}`);
      }

      // If updating paidBy and participants, validate paidBy is in participants
      if (
        updateExpenseDto.paidBy &&
        updateExpenseDto.participants &&
        !updateExpenseDto.participants.includes(updateExpenseDto.paidBy)
      ) {
        throw new BadRequestException(
          'Người thanh toán phải là một trong những người tham gia',
        );
      }

      // If only updating paidBy, validate against existing participants
      if (
        updateExpenseDto.paidBy &&
        !updateExpenseDto.participants &&
        !expense.participants.includes(updateExpenseDto.paidBy)
      ) {
        throw new BadRequestException(
          'Người thanh toán phải là một trong những người tham gia',
        );
      }

      // If only updating participants, validate against new or existing paidBy
      if (
        !updateExpenseDto.paidBy &&
        updateExpenseDto.participants &&
        !updateExpenseDto.participants.includes(expense.paidBy)
      ) {
        throw new BadRequestException(
          'Người thanh toán phải là một trong những người tham gia',
        );
      }

      // Update expense
      const updatedExpense = await this.expenseModel
        .findByIdAndUpdate(id, updateExpenseDto, { new: true })
        .exec();

      if (!updatedExpense) {
        throw new NotFoundException(`Không tìm thấy chi phí với id ${id}`);
      }

      return updatedExpense;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Không thể cập nhật chi phí: ${error.message}`,
      );
    }
  }

  /**
   * Delete expense (soft delete)
   * @param id Expense id
   * @returns Success message
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const expense = await this.expenseModel.findById(id).exec();
      if (!expense) {
        throw new NotFoundException(`Không tìm thấy chi phí với id ${id}`);
      }

      // Soft delete by setting isActive to false
      await this.expenseModel.findByIdAndUpdate(id, { isActive: false }).exec();

      return { message: 'Xóa chi phí thành công' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa chi phí');
    }
  }

  /**
   * Calculate expense summary
   * Shows how much each member paid and how much they need to pay to balance
   * @returns Summary of expenses
   */
  async getSummary(): Promise<any> {
    try {
      // Get all active expenses
      const expenses = await this.expenseModel.find({ isActive: true }).exec();

      if (expenses.length === 0) {
        return {
          expenses: [],
          totalAmount: 0,
          memberSummary: {},
          balanceTransactions: [],
        };
      }

      // Calculate total amount and amount per member
      const memberPaid: Record<string, number> = {};
      const memberShare: Record<string, number> = {};
      let totalAmount = 0;

      expenses.forEach((expense) => {
        const amount = expense.amount;
        const paidBy = expense.paidBy;
        const participants = expense.participants;

        // Add to total
        totalAmount += amount;

        // Add to amount paid by member
        memberPaid[paidBy] = (memberPaid[paidBy] || 0) + amount;

        // Calculate share per participant
        const sharePerPerson = amount / participants.length;

        participants.forEach((participant) => {
          memberShare[participant] =
            (memberShare[participant] || 0) + sharePerPerson;
        });
      });

      // Calculate net balance for each member
      const memberBalance: Record<string, number> = {};

      Object.keys({ ...memberPaid, ...memberShare }).forEach((member) => {
        const paid = memberPaid[member] || 0;
        const share = memberShare[member] || 0;
        memberBalance[member] = paid - share;
      });

      // Calculate who owes whom
      const debtors = Object.entries(memberBalance)
        .filter(([_, balance]) => balance < 0)
        .sort(([_, balanceA], [__, balanceB]) => balanceA - balanceB) as [
        string,
        number,
      ][];

      const creditors = Object.entries(memberBalance)
        .filter(([_, balance]) => balance > 0)
        .sort(([_, balanceA], [__, balanceB]) => balanceB - balanceA) as [
        string,
        number,
      ][];

      const transactions: { from: string; to: string; amount: number }[] = [];
      let debtorIndex = 0;
      let creditorIndex = 0;

      while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const [debtor, debtAmount] = debtors[debtorIndex];
        const [creditor, creditAmount] = creditors[creditorIndex];

        const absDebt = Math.abs(debtAmount);
        const absCredit = Math.abs(creditAmount);

        const transferAmount = Math.min(absDebt, absCredit);

        transactions.push({
          from: debtor,
          to: creditor,
          amount: Math.round(transferAmount),
        });

        debtors[debtorIndex] = [debtor, debtAmount + transferAmount];
        creditors[creditorIndex] = [creditor, creditAmount - transferAmount];

        if (Math.abs(debtors[debtorIndex][1]) < 0.01) {
          debtorIndex++;
        }

        if (Math.abs(creditors[creditorIndex][1]) < 0.01) {
          creditorIndex++;
        }
      }

      // Format the result
      return {
        expenses: formatMongooseDocs(expenses),
        totalAmount,
        memberSummary: {
          paid: memberPaid,
          share: memberShare,
          balance: memberBalance,
        },
        balanceTransactions: transactions,
      };
    } catch (error) {
      throw new BadRequestException('Không thể tính toán tổng chi phí');
    }
  }
  async importFromExcel(buffer: Buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Chuyển đổi dữ liệu từ Excel thành dạng CreateExpenseDto
    const expenses: CreateExpenseDto[] = data.map((row: any) => ({
      amount: Number(row['Số tiền']),
      description: row['Mô tả'],
      paidBy: this.normalizeParticipant(row['Người thanh toán']),
      participants: this.parseParticipants(row['Người tham gia']),
    }));

    // Lưu vào CSDL
    const savedExpenses: Expense[] = []; // Chỉ định kiểu Expense[] cho mảng
    for (const expense of expenses) {
      savedExpenses.push(await this.create(expense));
    }

    return savedExpenses;
  }

  private normalizeParticipant(name: string): string {
    // Chuyển tên người thành MemberType
    const nameMap: Record<string, string> = {
      Hồng: MemberType.HONG,
      Bình: MemberType.BINH,
      Minh: MemberType.MINH,
      Thắng: MemberType.THANG,
      Tuấn: MemberType.TUAN,
      Quân: MemberType.QUAN,
      Hải: MemberType.HAI,
    };

    return nameMap[name] || MemberType.OTHER;
  }

  private parseParticipants(participantsStr: string): string[] {
    // Phân tích chuỗi "Hồng, Bình, Minh" thành mảng MemberType
    if (!participantsStr) return [];

    return participantsStr
      .split(',')
      .map((name) => name.trim())
      .map((name) => this.normalizeParticipant(name));
  }
}
