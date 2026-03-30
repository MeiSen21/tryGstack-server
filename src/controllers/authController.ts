import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest, ApiResponse } from '../types';
import { authService } from '../services/authService';
import { BadRequestError } from '../utils/errors';

// 验证 Schema
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少需要 6 个字符'),
  captchaId: z.string().min(1, '验证码ID不能为空'),
  captchaCode: z.string().min(1, '验证码不能为空'),
});

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
  captchaId: z.string().min(1, '验证码ID不能为空'),
  captchaCode: z.string().min(1, '验证码不能为空'),
});

export class AuthController {
  /**
   * 用户注册
   * POST /api/auth/register
   */
  async register(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 验证请求体
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError(result.error.errors[0].message);
      }

      const { email, password, captchaId, captchaCode } = result.data;

      // 调用服务
      const authData = await authService.register({ email, password, captchaId, captchaCode });

      const response: ApiResponse<typeof authData> = {
        success: true,
        data: authData,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 用户登录
   * POST /api/auth/login
   */
  async login(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // 验证请求体
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        throw new BadRequestError(result.error.errors[0].message);
      }

      const { email, password, captchaId, captchaCode } = result.data;

      // 调用服务
      const authData = await authService.login({ email, password, captchaId, captchaCode });

      const response: ApiResponse<typeof authData> = {
        success: true,
        data: authData,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前用户信息
   * GET /api/auth/me
   */
  async getMe(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        throw new BadRequestError('用户未登录');
      }

      const user = await authService.getUserById(userId);

      const response: ApiResponse<typeof user> = {
        success: true,
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 检查邮箱是否可用
   * GET /api/auth/check-email?email=xxx
   */
  async checkEmail(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const email = req.query.email as string;

      if (!email) {
        throw new BadRequestError('请提供邮箱地址');
      }

      const isAvailable = await authService.checkEmailAvailability(email);

      const response: ApiResponse<{ available: boolean }> = {
        success: true,
        data: { available: isAvailable },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

// 导出单例实例
export const authController = new AuthController();
