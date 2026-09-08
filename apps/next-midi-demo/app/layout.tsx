import { SerwistProvider } from '@serwist/next/react'
import type { Metadata, Viewport } from 'next'
import { Roboto, Roboto_Mono } from 'next/font/google'
import './globals.css'

import type React from 'react'

const robotoSans = Roboto({
  variable: '--font-roboto-sans',
  subsets: ['latin'],
})

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
})

// TODO: set all proper and also in manifest.json
const APP_NAME = 'Musiclab PADs'
const APP_DEFAULT_TITLE = 'Musiclab PADs'
const APP_TITLE_TEMPLATE = '%s - PWA App'
const APP_DESCRIPTION = 'Musiclab PADs'

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_DEFAULT_TITLE,
    // startUpImage: [],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
}

export const viewport: Viewport = {
  // TODO: update to my greenish
  themeColor: '#FFFFFF',
}

export default function RootLayout({
  children,
}: React.PropsWithChildren<{
  children: React.ReactNode
}>) {
  // analytics flag has been added to avoid annoying hydration errors, because I
  // have the plugin installed in chrome, that adds this flag as well.
  return (
    <html
      lang="en"
      dir="ltr"
      {...(process.env.NODE_ENV === 'development'
        ? { 'data-google-analytics-opt-out': '' }
        : {})}
    >
      <head />
      <body className={`${robotoSans.variable} ${robotoMono.variable}`}>
        <SerwistProvider
          swUrl="/sw.js"
          disable={process.env.NODE_ENV === 'development'}
        >
          {children}
        </SerwistProvider>
      </body>
    </html>
  )
}
