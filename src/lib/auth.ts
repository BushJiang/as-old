/**
 * NextAuth 认证配置
 *
 * 支持邮箱魔法链接登录和传统密码登录
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // 邮箱魔法链接登录
    {
      id: "email",
      name: "Email",
      type: "email" as const,
      from: process.env.EMAIL_FROM || "如故 <noreply@rugumatch.com>",
      server: process.env.EMAIL_SERVER,
      maxAge: 24 * 60 * 60, // 链接 24 小时有效
      async sendVerificationRequest({
        identifier: email,
        url,
      }) {
        // 开发环境：在控制台显示链接（不发送邮件）
        if (process.env.NODE_ENV === "development") {
          console.log("\n========== 邮箱验证链接 ==========")
          console.log(`邮箱: ${email}`)
          console.log(`链接: ${url}`)
          console.log("================================\n")

          // 可以使用 nodemailer 或其他服务在开发环境发送邮件
          // 这里简化处理，直接在控制台显示
          return
        }

        // 生产环境：发送真实邮件
        try {
          // 这里需要配置邮件服务（Resend、SendGrid 等）
          // 示例使用 fetch 调用邮件 API
          await fetch(`${process.env.EMAIL_SERVER}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email,
              subject: "登录如故",
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0;">如故</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 40px 30px;">
                      <p>点击下面的按钮登录如故：</p>
                      <a href="${url}" style="display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px;">
                        登录
                      </a>
                      <p style="font-size: 14px; color: #666; margin-top: 30px;">
                        此链接将在 24 小时后过期。
                      </p>
                    </div>
                  </body>
                </html>
              `,
            }),
          })
        } catch (error) {
          console.error("发送验证邮件失败:", error)
        }
      },
    },
    // 保留传统密码登录作为备选
    Credentials({
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1)

          if (!user || !user.password) {
            return null
          }

          const isValid = await compare(
            credentials.password as string,
            user.password
          )

          if (!isValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          console.error("认证错误:", error)
          return null
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 天
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    }
  },
  events: {
    async signIn({ user }) {
      console.log("用户登录:", user.email)

      // 确保用户在数据库中存在（用于邮箱登录）
      if (user.email) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1)

        if (!existingUser) {
          await db.insert(users).values({
            id: user.id,
            email: user.email,
            name: user.name || user.email.split("@")[0],
          })
        }
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
})
