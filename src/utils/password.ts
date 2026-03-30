import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * 对密码进行哈希处理
 * @param password - 明文密码
 * @returns 哈希后的密码
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * 验证密码
 * @param password - 明文密码
 * @param hash - 哈希后的密码
 * @returns 是否匹配
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
