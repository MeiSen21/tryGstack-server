import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

/**
 * JWT 认证中间件
 * 验证请求头中的 Authorization Bearer Token
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('未提供 Token');
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      throw new UnauthorizedError('Token 格式无效');
    }

    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      throw new UnauthorizedError('Token 无效或已过期');
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 可选认证中间件
 * 如果提供了 Token 则解析，否则继续执行
 */
export const optionalAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);
    
    if (decoded && decoded.userId) {
      req.userId = decoded.userId;
    }
    
    next();
  } catch (error) {
    // 可选认证失败不阻止请求
    next();
  }
};
