/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出:全是客户端组件,导出成纯静态文件,Netlify 直接托管(不依赖 Next 插件,绕开 Next16 兼容问题)
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
