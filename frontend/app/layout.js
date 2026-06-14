import "./globals.css";
import { Geist } from "next/font/google";
import { GrowthProvider } from "./providers";
import Shell from "./shell";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata = {
  title: "Growth OS · 长期成长操作系统",
  description: "把人生目标拆解为每日动作 + AI 反馈闭环",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={geist.variable}>
      <body className="min-h-screen antialiased">
        <GrowthProvider>
          <Shell>{children}</Shell>
        </GrowthProvider>
      </body>
    </html>
  );
}
