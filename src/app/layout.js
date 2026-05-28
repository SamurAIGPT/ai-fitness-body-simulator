import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/saas/Navbar";

const font = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "AI Fitness Body Simulator - Premium Body Transformation Tool",
  description: "Simulate high-fidelity physical fitness transformations instantly using the advanced nano-banana-pro-edit model.",
};

export default function RootLayout({ children }) {
  const theme = process.env.NEXT_PUBLIC_THEME || 'emerald';

  return (
    <html lang="en" className="h-dvh w-full transition-colors duration-500" data-theme={theme} style={{ colorScheme: 'light' }}>
      <body className={`${font.className} h-dvh w-full flex flex-col antialiased transition-colors duration-500 bg-background text-foreground`}>
        <Providers>
          <Navbar />
          <div className="flex-1 flex flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
