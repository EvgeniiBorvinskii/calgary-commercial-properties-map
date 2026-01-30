/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['data.calgary.ca'],
  },
  env: {
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    CALGARY_OPEN_DATA_API: 'https://data.calgary.ca/resource',
  },
  experimental: {
    optimizePackageImports: ['mapbox-gl'],
  },
}

module.exports = nextConfig
