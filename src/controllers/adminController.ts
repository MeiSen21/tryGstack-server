import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, ApiResponse, GetUsersQuery, UpdateUserInput } from '../types';
import { authService } from '../services/authService';
import { BadRequestError } from '../utils/errors';

// 验证 Schema
const getUsersQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  pageSize: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  username: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email('邮箱格式不正确').optional(),
  role: z.enum(['admin', 'user']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
});

export class AdminController {
  /**
   * 获取用户列表（分页）
   * GET /api/admin/users
   */
  async getUsers(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 验证查询参数
      const result = getUsersQuerySchema.safeParse(req.query);
      if (!result.success) {
        throw new BadRequestError(result.error.errors[0].message);
      }

      const query: GetUsersQuery = result.data;
      const usersData = await authService.getUsers(query);

      const response: ApiResponse<typeof usersData> = {
        success: true,
        data: usersData,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新用户信息
   * PUT /api/admin/users/:id
   */
  async updateUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.params.id;
      
      // 不能修改自己
      if (userId === req.userId) {
        throw new BadRequestError('不能通过此接口修改自己的信息');
      }

      // 验证请求体
      const result = updateUserSchema.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError(result.error.errors[0].message);
      }

      const data: UpdateUserInput = result.data;
      const updatedUser = await authService.updateUser(userId, data);

      const response: ApiResponse<typeof updatedUser> = {
        success: true,
        data: updatedUser,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除用户
   * DELETE /api/admin/users/:id
   */
  async deleteUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.params.id;

      // 不能删除自己
      if (userId === req.userId) {
        throw new BadRequestError('不能删除自己的账户');
      }

      await authService.deleteUser(userId);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// 导出单例实例
export const adminController = new AdminController();
