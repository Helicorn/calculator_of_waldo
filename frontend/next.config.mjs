/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
        pathname: "/cdn/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/PokeAPI/sprites/**",
      },
      {
        protocol: "https",
        hostname: "d15f34w2p8l1cc.cloudfront.net",
        pathname: "/overwatch/**",
      },
      {
        protocol: "https",
        hostname: "blz-contentstack-images.akamaized.net",
        pathname: "/v3/assets/**",
      },
    ],
  },
};

export default nextConfig;
