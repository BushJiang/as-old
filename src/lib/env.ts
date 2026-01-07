/**
 * 环境变量配置
 *
 * 在服务器端安全地访问环境变量
 */

export const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || ''

if (typeof window !== 'undefined') {
  // 客户端检查（这段代码不会在客户端执行，只用于类型检查）
  console.warn('env.ts should only be imported on the server side')
}
