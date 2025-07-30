import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Reception Automation',
  description: 'タブレット端末で動作する受付自動化WEBアプリケーション',
  keywords: ['reception', 'automation', 'tablet', 'AI', 'voice'],
  authors: [{ name: 'Reception Automation Team' }],
  // PWA considerations
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Reception Automation',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming on tablet for consistent UI
  viewportFit: 'cover', // Handle notches and safe areas
  // Tablet-optimized viewport
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={inter.variable}>
      <head>
        {/* Additional meta tags for tablet optimization */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="width" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://api.openai.com" />
        <link rel="preconnect" href="https://hooks.slack.com" />
        
        {/* Prevent iOS Safari from adding telephone links */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body 
        className={`${inter.className} font-sans antialiased bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen`}
        style={{
          // Prevent text selection on tablets for better UX
          userSelect: 'none',
          // Prevent callout on long-press
          WebkitTouchCallout: 'none',
          // Disable tap highlight on tablets
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Skip to main content for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
        >
          メインコンテンツへスキップ
        </a>
        
        <main id="main-content" className="relative">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </body>
    </html>
  )
}