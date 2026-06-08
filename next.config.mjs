/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // for slim Docker images on Azure Container Apps
};
export default nextConfig;
