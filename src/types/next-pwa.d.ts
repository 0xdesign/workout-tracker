declare module 'next-pwa' {
  import { NextConfig } from 'next';
  export default function withPWA(config?: { 
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    [key: string]: any;
  }): (nextConfig: NextConfig) => NextConfig;
} 