import * as React from 'react';

interface VerificationCodeEmailProps {
  code: string;
}

export function VerificationCodeEmail({ code }: VerificationCodeEmailProps) {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: '1.6',
      color: '#333',
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* 头部渐变区域 */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <h1 style={{
          color: 'white',
          margin: '0',
          fontSize: '28px'
        }}>
          如故
        </h1>
        <p style={{
          color: 'rgba(255,255,255,0.9)',
          margin: '10px 0 0 0'
        }}>
          遇见有趣的灵魂
        </p>
      </div>

      {/* 内容区域 */}
      <div style={{
        background: '#f9fafb',
        padding: '40px 30px',
        borderRadius: '0 0 8px 8px'
      }}>
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          您好，
        </p>
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          您的登录验证码是：
        </p>

        {/* 验证码显示区域 */}
        <div style={{
          background: 'white',
          padding: '20px',
          textAlign: 'center',
          borderRadius: '8px',
          margin: '30px 0'
        }}>
          <span style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#667eea',
            letterSpacing: '4px'
          }}>
            {code}
          </span>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#666',
          marginTop: '30px'
        }}>
          此验证码将在 <strong>5 分钟</strong>后过期。
        </p>

        <p style={{
          fontSize: '14px',
          color: '#666',
          marginTop: '10px'
        }}>
          如果您没有请求此验证码，可以忽略此邮件。
        </p>
      </div>

      {/* 页脚 */}
      <div style={{
        textAlign: 'center',
        marginTop: '30px',
        fontSize: '12px',
        color: '#999'
      }}>
        <p>© 2025 如故. All rights reserved.</p>
      </div>
    </div>
  );
}
