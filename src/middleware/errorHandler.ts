import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import { AppError } from '../utils/errors';

/**
 * 全局错误处理中间件
 */
export const errorHandler = (
  err: Error | AppError,
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  // 如果是 AppError，使用预定义的错误信息
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // 处理 Prisma 错误
  if (err.name === 'PrismaClientKnownRequestError') {
    // @ts-expect-error - Prisma error has code property
    const code = err.code as string;
    
    // 唯一约束冲突
    if (code === 'P2002') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'CONFLICT',
          message: '数据已存在',
        },
      };
      res.status(409).json(response);
      return;
    }

    // 外键约束失败
    if (code === 'P2003') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: '关联数据不存在',
        },
      };
      res.status(400).json(response);
      return;
    }

    // 记录未找到
    if (code === 'P2025') {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '资源不存在',
        },
      };
      res.status(404).json(response);
      return;
    }
  }

  // 处理 Zod 验证错误
  if (err.name === 'ZodError') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        // @ts-expect-error - Zod error has issues property
        message: err.issues?.[0]?.message || '数据验证失败',
      },
    };
    res.status(422).json(response);
    return;
  }

  // 处理 JWT 错误
  if (err.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token 无效',
      },
    };
    res.status(401).json(response);
    return;
  }

  if (err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token 已过期',
      },
    };
    res.status(401).json(response);
    return;
  }

  // 未知错误
  console.error('Unhandled error:', err);
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message,
    },
  };
  res.status(500).json(response);
};

/**
 * 404 处理中间件
 */
export const notFoundHandler = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `路径 ${req.originalUrl} 不存在`,
    },
  };
  res.status(404).json(response);
};
