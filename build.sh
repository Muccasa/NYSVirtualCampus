#!/bin/bash

# Build the client
npm run vercel-build

# Build the server
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

echo "Build completed successfully!"
