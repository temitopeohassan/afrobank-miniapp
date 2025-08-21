import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
  "accountAssociation": {
    "header": "eyJmaWQiOjcwODcwNywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDQwMTJGRmQzQmE5ZTJiRjY3NDIzNTFEQzJDNDE1NWFDRjBEZjVhZWUifQ",
    "payload": "eyJkb21haW4iOiJhZnJvYmFuay1taW5pYXBwLWRlbW8udmVyY2VsLmFwcCJ9",
    "signature": "MHhhZDliOGEyMzk5ZDg0M2VhMjYwOGEwNmZiNzM4OWU0Yjc4N2ZhM2E5MGJlMTAwZWE1ZDNkOGRjYmU5MWRlMjFkNTBmOGM1YzI2MzBmZWQwMjdjNGQ0Y2ZjNzllNGVkZDU0YjhkZjIyN2I0ZWNhYWQ0NDQ3MGQyY2Q4OWJlZWIyZTFj"
  },
    frame: {
      version: '1',
      name: 'Afro Bank Mini App',
      iconUrl: 'https://afrobank-miniapp-demo.vercel.app/icon.png',
      splashImageUrl: 'https://afrobank-miniapp-demo.vercel.app/splash.png',
      splashBackgroundColor: '#FFFFFF',
      homeUrl: 'https://afrobank-miniapp-demo.vercel.app/',
      imageUrl: 'https://afrobank-miniapp-demo.vercel.app/image.png',
      buttonTitle: 'Afro Bank',
      heroImageUrl:
        'https://afrobank-miniapp-demo.vercel.app/image.png',
      webhookUrl: 'https://afrobank-miniapp-demo.vercel.app/api/webhook',
      subtitle: 'Your Trusted Financial Partner',
      description: 'Buy Airtime, Data and Get a Virtual Card, Pay Bills',
      "screenshotUrls": [
      "https://afrobank-miniapp-demo.vercel.app/IMG_1781.jpg",
      "https://afrobank-miniapp-demo.vercel.app/IMG_1782.jpg",
      "https://afrobank-miniapp-demo.vercel.app/IMG_1780.jpg"
    ],
      primaryCategory: 'finance',
     tags: [
      "airtime",
      "data",
      "bills",
      "cards"
    ],
      tagline: 'Your Trusted Financial Partner',
      ogTitle: 'Afro Bank Mini App',
      ogDescription: 'Buy Airtime, Data and Get a Virtual Card, Pay Bills',
      ogImageUrl:
        'https://afrobank-miniapp-demo.vercel.app/og-image.png',
      castShareUrl: 'https://afrobank-miniapp-demo.vercel.app/',
    },
  };

  return NextResponse.json(config);
}

export const runtime = 'edge';
