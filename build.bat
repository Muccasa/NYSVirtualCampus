@echo off

REM Build the client
npm run vercel-build

REM Build the server
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/server

echo Build completed successfully!
