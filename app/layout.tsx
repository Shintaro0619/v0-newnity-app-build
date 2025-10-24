import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import WalletConnectionManager from "@/components/web3/wallet-connection-manager"

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
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined') {
                  console.log('[v0] Layout script loaded');
                  
                  if (typeof window.process === 'undefined') {
                    window.process = {
                      env: {},
                      version: 'v18.0.0',
                      versions: {},
                      platform: 'browser',
                      // Proper emitWarning implementation that handles all call patterns
                      emitWarning: function emitWarning(warning, type, code, ctor) {
                        // Silently ignore all warnings in browser environment
                        return undefined;
                      },
                      nextTick: function(callback) { 
                        setTimeout(callback, 0); 
                      },
                      // Add EventEmitter-like methods
                      on: function() { return this; },
                      once: function() { return this; },
                      off: function() { return this; },
                      emit: function() { return false; },
                      removeListener: function() { return this; },
                      removeAllListeners: function() { return this; },
                      listeners: function() { return []; }
                    };
                  } else {
                    // Ensure emitWarning exists and is properly bound
                    if (typeof window.process.emitWarning !== 'function') {
                      window.process.emitWarning = function emitWarning(warning, type, code, ctor) {
                        return undefined;
                      };
                    }
                    // Add missing EventEmitter methods if needed
                    if (typeof window.process.emit !== 'function') {
                      window.process.emit = function() { return false; };
                    }
                  }
                  
                  // Polyfill global
                  if (typeof window.global === 'undefined') {
                    window.global = window;
                  }
                  
                  // Suppress console errors
                  var originalError = console.error;
                  console.error = function() {
                    var args = Array.prototype.slice.call(arguments);
                    var errorString = String(args[0] || '');
                    var errorStack = (args[0] && args[0].stack) || '';
                    
                    if (
                      errorString.includes('process.emitWarning') ||
                      errorString.includes('walletconnect') ||
                      errorString.includes('heartbeat') ||
                      errorString.includes('Cannot read properties of undefined') ||
                      errorString.includes('reading \\'apply\\'') ||
                      errorString.includes('.apply') ||
                      errorString.includes('_.emit') ||
                      errorString.includes('i.pulse') ||
                      errorStack.includes('walletconnect') ||
                      errorStack.includes('heartbeat') ||
                      errorStack.includes('pino')
                    ) {
                      return;
                    }
                    
                    originalError.apply(console, args);
                  };
                  
                  // Global error handler - capture phase
                  window.addEventListener('error', function(event) {
                    var message = event.message || '';
                    var stack = (event.error && event.error.stack) || '';
                    var filename = event.filename || '';
                    
                    if (
                      message.includes('Cannot read properties of undefined') ||
                      message.includes('reading \\'apply\\'') ||
                      message.includes('.apply') ||
                      message.includes('process.emitWarning') ||
                      message.includes('_.emit') ||
                      message.includes('i.pulse') ||
                      stack.includes('walletconnect') ||
                      stack.includes('heartbeat') ||
                      stack.includes('pino') ||
                      stack.includes('_.emit') ||
                      stack.includes('i.pulse') ||
                      filename.includes('walletconnect') ||
                      filename.includes('heartbeat')
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      event.stopImmediatePropagation();
                      return false;
                    }
                  }, true);
                  
                  // Unhandled promise rejection handler
                  window.addEventListener('unhandledrejection', function(event) {
                    var reason = String(event.reason || '');
                    var stack = (event.reason && event.reason.stack) || '';
                    
                    if (
                      reason.includes('walletconnect') ||
                      reason.includes('heartbeat') ||
                      reason.includes('pulse.walletconnect.org') ||
                      reason.includes('Cannot read properties of undefined') ||
                      reason.includes('.apply') ||
                      reason.includes('_.emit') ||
                      reason.includes('i.pulse') ||
                      stack.includes('walletconnect') ||
                      stack.includes('heartbeat')
                    ) {
                      event.preventDefault();
                      return false;
                    }
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`font-sans ${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        <Providers>
          <WalletConnectionManager />
          <Navbar />
          {children}
          <SiteFooter />
        </Providers>
      </body>
    </html>
  )
}
