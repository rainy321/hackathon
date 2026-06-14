import "./globals.css";
import { GrowthProvider } from "./providers";
import Shell from "./shell";

export const metadata = {
  title: "Growth OS · 长期成长操作系统",
  description: "把人生目标拆解为每日动作 + AI 反馈闭环",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <GrowthProvider>
          <Shell>{children}</Shell>
        </GrowthProvider>
      </body>
    </html>
  );
}
