/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required to disable Next.js's own HTTP server — our custom server.js takes over
  // This is needed so Socket.io can share the same port as Next.js
  reactStrictMode: true,
};

export default nextConfig;
