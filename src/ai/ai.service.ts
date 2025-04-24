import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIModel, AIModelType } from './schemas/ai.schema';
import { CreateAIModelDto, UpdateAIModelDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  constructor(
    @InjectModel(AIModel.name) private readonly aiModelModel: Model<AIModel>,
  ) {}

  /**
   * Tạo một model AI mới
   * @param createAIModelDto Dữ liệu để tạo model
   * @returns Model AI đã được tạo
   */
  async create(createAIModelDto: CreateAIModelDto): Promise<AIModel> {
    try {
      // Kiểm tra xem model có tồn tại chưa
      const existingModel = await this.aiModelModel
        .findOne({
          aiModel: createAIModelDto.aiModel,
          nameModel: createAIModelDto.nameModel,
        })
        .exec();

      if (existingModel) {
        throw new ConflictException(
          `Model với tên ${createAIModelDto.nameModel} đã tồn tại cho ${createAIModelDto.aiModel}`,
        );
      }

      // Nếu đang tạo model với status = true, kiểm tra xem đã có model nào active chưa
      if (createAIModelDto.status === true) {
        const activeModel = await this.aiModelModel
          .findOne({
            aiModel: createAIModelDto.aiModel,
            status: true,
          })
          .exec();

        if (activeModel) {
          throw new ConflictException(
            `Đã có một model ${createAIModelDto.aiModel} đang active (${activeModel.nameModel}). Vui lòng tắt model này trước khi kích hoạt model mới.`,
          );
        }
      }

      // Tạo model mới
      const newModel = new this.aiModelModel(createAIModelDto);
      return await newModel.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(`Không thể tạo model: ${error.message}`);
    }
  }

  /**
   * Lấy tất cả các model AI
   * @returns Danh sách các model AI
   */
  async findAll(): Promise<AIModel[]> {
    return this.aiModelModel.find().exec();
  }

  /**
   * Lấy model theo ID
   * @param id ID của model
   * @returns Model AI được tìm thấy
   */
  async findById(id: string): Promise<AIModel> {
    const model = await this.aiModelModel.findById(id).exec();

    if (!model) {
      throw new NotFoundException(`Model với ID ${id} không tìm thấy`);
    }

    return model;
  }

  /**
   * Cập nhật model AI
   * @param id ID của model cần cập nhật
   * @param updateAIModelDto Dữ liệu cập nhật
   * @returns Model AI sau khi cập nhật
   */
  async update(
    id: string,
    updateAIModelDto: UpdateAIModelDto,
  ): Promise<AIModel> {
    try {
      // Tìm model cần cập nhật
      const existingModel = await this.findById(id);

      // Nếu thay đổi tên hoặc loại AI, kiểm tra xem có trùng không
      if (
        (updateAIModelDto.aiModel &&
          updateAIModelDto.aiModel !== existingModel.aiModel) ||
        (updateAIModelDto.nameModel &&
          updateAIModelDto.nameModel !== existingModel.nameModel)
      ) {
        const duplicateCheck = await this.aiModelModel
          .findOne({
            aiModel: updateAIModelDto.aiModel || existingModel.aiModel,
            nameModel: updateAIModelDto.nameModel || existingModel.nameModel,
            _id: { $ne: id }, // Loại trừ model hiện tại
          })
          .exec();

        if (duplicateCheck) {
          throw new ConflictException(
            `Model với tên ${updateAIModelDto.nameModel || existingModel.nameModel} đã tồn tại cho ${updateAIModelDto.aiModel || existingModel.aiModel}`,
          );
        }
      }

      // Nếu đang cập nhật status thành true, kiểm tra xem đã có model nào active chưa
      if (updateAIModelDto.status === true && !existingModel.status) {
        const activeModel = await this.aiModelModel
          .findOne({
            aiModel: updateAIModelDto.aiModel || existingModel.aiModel,
            status: true,
            _id: { $ne: id }, // Loại trừ model hiện tại
          })
          .exec();

        if (activeModel) {
          throw new ConflictException(
            `Đã có một model ${updateAIModelDto.aiModel || existingModel.aiModel} đang active (${activeModel.nameModel}). Vui lòng tắt model này trước khi kích hoạt model mới.`,
          );
        }
      }

      const updatedModel = await this.aiModelModel
        .findByIdAndUpdate(id, updateAIModelDto, { new: true })
        .exec();

      if (!updatedModel) {
        throw new NotFoundException(`Model với ID ${id} không tìm thấy`);
      }

      return updatedModel;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Không thể cập nhật model: ${error.message}`,
      );
    }
  }

  /**
   * Kích hoạt hoặc vô hiệu hóa model
   * @param id ID của model
   * @param status Trạng thái mới (true/false)
   * @returns Model sau khi cập nhật
   */
  async updateStatus(id: string, status: boolean): Promise<AIModel> {
    // Lấy thông tin model hiện tại
    const currentModel = await this.findById(id);

    // Nếu đang cập nhật status từ false thành true, kiểm tra xem đã có model nào active chưa
    if (status === true && !currentModel.status) {
      const activeModel = await this.aiModelModel
        .findOne({
          aiModel: currentModel.aiModel,
          status: true,
          _id: { $ne: id }, // Loại trừ model hiện tại
        })
        .exec();

      if (activeModel) {
        throw new ConflictException(
          `Đã có một model ${currentModel.aiModel} đang active (${activeModel.nameModel}). Vui lòng tắt model này trước khi kích hoạt model mới.`,
        );
      }
    }

    const model = await this.aiModelModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!model) {
      throw new NotFoundException(`Model với ID ${id} không tìm thấy`);
    }

    return model;
  }

  /**
   * Xóa model AI
   * @param id ID của model cần xóa
   * @returns Thông tin xác nhận xóa
   */
  async remove(id: string): Promise<{ deleted: boolean; message: string }> {
    const result = await this.aiModelModel.deleteOne({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Model với ID ${id} không tìm thấy`);
    }

    return {
      deleted: true,
      message: `Model với ID ${id} đã được xóa thành công`,
    };
  }
}
