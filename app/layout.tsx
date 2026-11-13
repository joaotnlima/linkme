import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Links",
  description: "Links and latest posts",
};

// Runs before paint: manual override (localStorage) > local time (dark 19:00–07:00).
const themeInit = `(function(){try{var o=localStorage.getItem('theme');var d=document.documentElement.getAttribute('data-theme-default')||'auto';var h=new Date().getHours();var auto=(h>=19||h<7)?'dark':'light';var t=o||(d==='auto'?auto:d);document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
