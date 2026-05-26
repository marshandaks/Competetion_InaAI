/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  },
}

module.exports = withSentryConfig(
  nextConfig,
  {
    // Suppress logging and token check for local dev builds
    silent: true,
    org: "sentiview",
    project: "sentiview-frontend",
  },
  {
    widenClientSandbox: true,
    transpileClientSDK: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
)
