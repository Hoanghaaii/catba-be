import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Queues } from './queue.config';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    @InjectQueue(Queues.SCRIPT) private readonly apiKeyQueue: Queue,
  ) {}

  /**
   * Lấy thông tin về job đang xử lý
   * @param jobId ID của job cần kiểm tra
   * @returns Thông tin về job
   */
  async getJobInfo(jobId: string) {
    try {
      const job = await this.apiKeyQueue.getJob(jobId);

      if (!job) {
        return { exists: false };
      }

      const state = await job.getState();
      const progress = job.progress;

      return {
        exists: true,
        id: job.id,
        state,
        progress,
        data: job.data,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
        attemptsMade: job.attemptsMade,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get job info: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Xóa một job khỏi queue
   * @param jobId ID của job cần xóa
   * @returns true nếu xóa thành công, false nếu không tìm thấy job
   */
  async removeJob(jobId: string) {
    try {
      const job = await this.apiKeyQueue.getJob(jobId);

      if (!job) {
        return false;
      }

      await job.remove();
      return true;
    } catch (error) {
      this.logger.error(`Failed to remove job: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy danh sách các active jobs trong queue
   * @returns Danh sách các job đang hoạt động
   */
  async getActiveJobs() {
    try {
      return await this.apiKeyQueue.getActive();
    } catch (error) {
      this.logger.error(
        `Failed to get active jobs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lấy danh sách các waiting jobs trong queue
   * @returns Danh sách các job đang chờ
   */
  async getWaitingJobs() {
    try {
      return await this.apiKeyQueue.getWaiting();
    } catch (error) {
      this.logger.error(
        `Failed to get waiting jobs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Lấy số lượng job trong queue
   * @returns Số lượng job theo trạng thái
   */
  async getJobCounts() {
    try {
      return await this.apiKeyQueue.getJobCounts(
        'active',
        'waiting',
        'completed',
        'failed',
        'delayed',
      );
    } catch (error) {
      this.logger.error(
        `Failed to get job counts: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
