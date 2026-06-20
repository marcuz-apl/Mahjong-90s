import { Noto_Sans_SC } from 'next/font/google';
import './global.css';

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});

export const metadata = {
  title: '街機麻將 Arcade Mahjong 90s - 經典電子基盤 & 天開眼',
  description: '重溫1990年代經典街機街頭麻將遊戲！包含經典電子基盤、天開眼透視、三元換牌以及大四喜、大三元等經典配牌作弊功能。',
  keywords: ['街機麻將', 'Arcade Mahjong', '電子基盤', '天開眼', '麻將遊戲', '懷舊街機', '網頁麻將'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://arcade-mahjong.example.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '街機麻將 Arcade Mahjong 90s',
    description: '重溫90年代經典街機街頭麻將遊戲，經典電子基盤 & 天開眼作弊模式熱血再現！',
    url: 'https://arcade-mahjong.example.com',
    siteName: 'Arcade Mahjong 90s',
    images: [
      {
        url: '/arcade_hall.png',
        width: 1200,
        height: 630,
        alt: 'Arcade Mahjong 90s Game Hall',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={notoSansSC.className} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
