const path = require('path');
const fs = require('fs');

const localReact = path.resolve(__dirname, 'node_modules/react');
const localReactDom = path.resolve(__dirname, 'node_modules/react-dom');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      react: fs.existsSync(localReact)
        ? localReact
        : path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': fs.existsSync(localReactDom)
        ? localReactDom
        : path.resolve(__dirname, '../../node_modules/react-dom'),
    };
    return config;
  },
};

module.exports = nextConfig;
