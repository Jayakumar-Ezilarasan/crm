#!/bin/bash

echo "Testing TypeScript build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
fi
