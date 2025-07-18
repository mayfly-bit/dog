/** @type {import('next').NextConfig} */
const nextConfig = {
  // 环境变量配置（避免 .env.local 文件丢失问题）
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://sevtqdbdzuolezjeauaz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldnRxZGJkenVvbGV6amVhdWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NDc4ODQsImV4cCI6MjA2NjMyMzg4NH0.CS99HdyPn2pxNyr9RQ2YMu2Lxp74Draj_lQK_Js41qM',
    DEEPSEEK_API_KEY: 'sk-50ab6ab4ebe745f9aa255b2eb135dd9c',
  },

  // 实验性功能配置（简化配置避免构建错误）
  experimental: {
    // 暂时禁用可能导致构建错误的功能
    // optimizeCss: true,
  },

  // 编译器优化（简化配置）
  compiler: {
    // 生产环境移除console.log（但保留error和warn）
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // 图片优化配置
  images: {
    domains: [
      'localhost',
      // 添加您的图片域名
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // PWA 配置（渐进式网页应用）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },

  // 重定向配置
  async redirects() {
    return [
      {
        source: '/dogs',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Webpack 配置优化（简化配置）
  webpack: (config, { dev, isServer }) => {
    // 添加别名
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    }

    return config
  },

  // 压缩配置
  compress: true,

  // 开发环境配置
  ...(process.env.NODE_ENV === 'development' && {
    // 开发环境快速刷新
    reactStrictMode: true,
  }),
}

module.exports = nextConfig 