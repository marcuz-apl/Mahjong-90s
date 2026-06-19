import './global.css';

export const metadata = {
  title: '街機麻將 大滿貫',
  description: '90年代經典街機麻將遊戲網頁版',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
