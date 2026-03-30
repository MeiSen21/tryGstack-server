import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, ApiResponse, WorkspaceConfig } from '../types';
import { workspaceService } from '../services/workspaceService';
import { BadRequestError } from '../utils/errors';

// 验证 Schema
const createWorkspaceSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过 100 个字符'),
  description: z.string().max(500, '描述不能超过 500 个字符').optional(),
  config: z.object({
    charts: z.array(z.any()).optional(),
    layout: z.array(z.any()).optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称不能超过 100 个字符').optional(),
  description: z.string().max(500, '描述不能超过 500 个字符').optional().nullable(),
  config: z.object({
    charts: z.array(z.any()).optional(),
    layout: z.array(z.any()).optional(),
  }).optional(),
  isDefault: z.boolean().optional(),
});

export class WorkspaceController {
  /**
   * 获取所有 Workspace
   * GET /api/workspaces
   */
  async getAll(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const workspaces = await workspaceService.findAllByUser(userId);

      const response: ApiResponse<typeof workspaces> = {
        success: true,
        data: workspaces,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取单个 Workspace
   * GET /api/workspaces/:id
   */
  async getById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError('Workspace ID 不能为空');
      }

      const workspace = await workspaceService.findById(id, userId);

      const response: ApiResponse<typeof workspace> = {
        success: true,
        data: workspace,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 创建 Workspace
   * POST /api/workspaces
   */
  async create(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;

      // 验证请求体
      const result = createWorkspaceSchema.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError(result.error.errors[0].message);
      }

      const workspace = await workspaceService.create(userId, result.data);

      const response: ApiResponse<typeof workspace> = {
        success: true,
        data: workspace,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新 Workspace
   * PUT /api/workspaces/:id
   */
  async update(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError('Workspace ID 不能为空');
      }

      // 验证请求体
      const result = updateWorkspaceSchema.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError(result.error.errors[0].message);
      }

      const workspace = await workspaceService.update(id, userId, result.data);

      const response: ApiResponse<typeof workspace> = {
        success: true,
        data: workspace,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除 Workspace
   * DELETE /api/workspaces/:id
   */
  async delete(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError('Workspace ID 不能为空');
      }

      await workspaceService.delete(id, userId);

      const response: ApiResponse<{ message: string }> = {
        success: true,
        data: { message: 'Workspace 已删除' },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 设置默认 Workspace
   * PATCH /api/workspaces/:id/default
   */
  async setDefault(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError('Workspace ID 不能为空');
      }

      const workspace = await workspaceService.setDefault(id, userId);

      const response: ApiResponse<typeof workspace> = {
        success: true,
        data: workspace,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取默认 Workspace
   * GET /api/workspaces/default
   */
  async getDefault(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const workspace = await workspaceService.getDefault(userId);

      const response: ApiResponse<typeof workspace> = {
        success: true,
        data: workspace,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新 Workspace 配置
   * PATCH /api/workspaces/:id/config
   */
  async updateConfig(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { config } = req.body;

      if (!id) {
        throw new BadRequestError('Workspace ID 不能为空');
      }

      if (!config || typeof config !== 'object') {
        throw new BadRequestError('配置数据无效');
      }

      const workspace = await workspaceService.updateConfig(id, userId, config as WorkspaceConfig);

      const response: ApiResponse<typeof workspace> = {
        success: true,
        data: workspace,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// 导出单例实例
export const workspaceController = new WorkspaceController();
