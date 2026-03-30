import prisma from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { captchaService } from './captchaService';
import { 
  RegisterInput, 
  LoginInput, 
  AuthResponse, 
  UserWithoutPassword 
} from '../types';
import { 
  ConflictError, 
  UnauthorizedError, 
  NotFoundError,
  BadRequestError
} from '../utils/errors';

export class AuthService {
  /**
   * 用户注册
   * @param data - 注册信息
   * @returns 用户信息和 Token
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    const { email, password, captchaId, captchaCode } = data;

    // 验证验证码
    const isCaptchaValid = captchaService.verifyCaptcha(captchaId, captchaCode);
    if (!isCaptchaValid) {
      throw new BadRequestError('验证码错误或已过期');
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('该邮箱已被注册');
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // 生成 JWT Token
    const token = generateToken(user.id);

    // 返回用户信息和 Token（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 用户登录
   * @param data - 登录信息
   * @returns 用户信息和 Token
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    const { email, password, captchaId, captchaCode } = data;

    // 验证验证码
    const isCaptchaValid = captchaService.verifyCaptcha(captchaId, captchaCode);
    if (!isCaptchaValid) {
      throw new BadRequestError('验证码错误或已过期');
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('邮箱或密码错误');
    }

    // 生成 JWT Token
    const token = generateToken(user.id);

    // 返回用户信息和 Token（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  /**
   * 根据 ID 获取用户信息
   * @param userId - 用户 ID
   * @returns 用户信息
   */
  async getUserById(userId: string): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * 检查邮箱是否可用
   * @param email - 邮箱地址
   * @returns 是否可用
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    return !existingUser;
  }
}

// 导出单例实例
export const authService = new AuthService();
