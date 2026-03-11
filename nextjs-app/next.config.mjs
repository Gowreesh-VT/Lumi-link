/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prevent Next.js from trying to bundle native/server-only modules
  serverExternalPackages: ['serialport', '@serialport/parser-readline', 'socket.io'],
};

export default nextConfig;
