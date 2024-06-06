# Build and zip the lambda code for deployment to AWS
esbuild ./index.ts --bundle --sourcemap --format=cjs --platform=node --outfile=dist/index.cjs
rm dist/index.zip 2>/dev/null
zip -j dist/index.zip dist/index.cjs
