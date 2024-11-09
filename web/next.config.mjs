/** @type {import('next').NextConfig} */
const nextConfig = {
async redirects() {
  return [
    {
      source: '/',
      destination: '/list-files',
      permanent: true, // Use `true` for a 308 permanent redirect, or `false` for a 307 temporary redirect
    },
  ];
},
};

export default nextConfig;
