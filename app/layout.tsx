import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import {ClerkProvider} from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Kyōshai - AI Career Coach ",
  description: "Find your next career step with Kyōshai. Our AI coach delivers personalized industry insights, crafts tailored resumes, and provides powerful interview preparation to help you land your dream job.",
};
const inter = Inter({subsets:["latin"]})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <ClerkProvider appearance={{
        baseTheme: dark
      }}>
          <html lang="en" suppressHydrationWarning>
      <body
        className={` ${inter.className} `}
      >
               <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* header */}
            <Header />
            <main className="min-h-screen">{children}</main>
             <Toaster richColors />
            {/* footer */}
            <footer className="bg-muted/50 py-12">
              <div className="container mx-auto px-4 text-center text-gray-400">
                <p>Made with 💗 by Harpreet</p>
              </div> 
            </footer>
          </ThemeProvider> 
      </body>
    </html>
      </ClerkProvider>
  
  );
}