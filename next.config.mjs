import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && !process.env.ENABLE_PWA
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración para compatibilidad con next-pwa
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Configuración del cliente para PWA
    }
    return config
  },
}

export default pwaConfig(nextConfig)
