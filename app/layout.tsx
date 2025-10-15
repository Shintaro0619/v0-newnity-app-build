import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

export const metadata: Metadata = {
  title: "newnity - Love from around the world. Support keeps circulating.",
  description:
    "A stablecoin crowdfunding platform with FanFi layer. Where creators meet their fans and support keeps circulating.",
  generator: "newnity",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  // Polyfill process object
                  if (typeof window.process === 'undefined') {
                    window.process = {
                      env: {},
                      version: '',
                      versions: {},
                      emitWarning: function(warning, type, code) {
                        // Silently ignore warnings
                      },
                      nextTick: function(callback) {
                        setTimeout(callback, 0);
                      }
                    };
                  } else {
                    if (typeof window.process.emitWarning !== 'function') {
                      window.process.emitWarning = function(warning, type, code) {
                        // Silently ignore warnings
                      };
                    }
                  }
                  
                  // Polyfill global
                  if (typeof window.global === 'undefined') {
                    window.global = window;
                  }
                  
                  // Suppress WalletConnect errors globally
                  var originalError = console.error;
                  console.error = function() {
                    var args = Array.prototype.slice.call(arguments);
                    var errorString = String(args[0]);
                    
                    if (
                      errorString.includes('process.emitWarning') ||
                      errorString.includes('walletconnect') ||
                      errorString.includes('heartbeat') ||
                      errorString.includes('Cannot read properties of undefined')
                    ) {
                      return;
                    }
                    
                    originalError.apply(console, args);
                  };
                  
                  // Global error handler
                  window.addEventListener('error', function(event) {
                    var message = event.message || '';
                    var stack = (event.error && event.error.stack) || '';
                    
                    if (
                      message.includes('Cannot read properties of undefined') ||
                      message.includes('process.emitWarning') ||
                      stack.includes('walletconnect') ||
                      stack.includes('heartbeat') ||
                      stack.includes('pino')
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      return false;
                    }
                  }, true);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <Providers>
          <Navbar />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  )
}
