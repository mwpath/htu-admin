/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel 주소로 접속하면 바로 관리자 페이지로
  async redirects() {
    return [{ source: '/', destination: '/admin', permanent: false }];
  },
};
export default nextConfig;
