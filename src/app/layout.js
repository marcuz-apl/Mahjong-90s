import { Noto_Sans_SC } from 'next/font/google';
import './global.css';

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

export const metadata = {
  title: '街機麻將 Arcade Mahjong 90s',
  description: '90年代經典街機麻將遊戲網頁版',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={notoSansSC.className} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
