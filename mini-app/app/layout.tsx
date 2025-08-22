import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { WagmiWrapper } from '@/components/providers/wagmi-provider'

export const metadata: Metadata = {
  title: 'Afro Bank - Your Trusted Financial Partner',
  description: 'Buy airtime, data, pay bills, and get virtual cards with Afro Bank',
  generator: 'Next.js',
  manifest: '/farcaster-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Afro Bank',
  },
  openGraph: {
    title: 'Afro Bank',
    description: 'Your trusted financial partner',
    type: 'website',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <WagmiWrapper>
          {children}
        </WagmiWrapper>
      </body>
    </html>
  )
}
