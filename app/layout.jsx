import "./globals.css";

export const metadata = {
  title: "TTMFlow — ระบบจัดการคำขอภายในองค์กร · Talk to Me Co., Ltd.",
  description: "ISO 9001 internal request management system",
  icons: { icon: "/assets/logo.jpg" },
};

export const viewport = {
  width: 1440,
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
