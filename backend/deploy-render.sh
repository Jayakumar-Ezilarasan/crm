#!/bin/bash

# Render Deployment Script for CRM Backend
# Make sure to run this from the backend directory

echo "🚀 Starting Render deployment for CRM Backend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the backend directory."
    exit 1
fi

# Check if Git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: Git repository not found. Please initialize Git and commit your changes."
    exit 1
fi

# Check if all required files exist
echo "📋 Checking required files..."
required_files=("render.yaml" "Dockerfile" ".dockerignore" "package.json" "tsconfig.json" "src/index.ts")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required file $file not found."
        exit 1
    fi
done
echo "✅ All required files found."

# Build the project locally to test
echo "🔨 Testing build process..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the issues before deploying."
    exit 1
fi
echo "✅ Build test successful."

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma client generation failed."
    exit 1
fi
echo "✅ Prisma client generated successfully."

# Check if changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes."
    echo "   It's recommended to commit your changes before deploying."
    read -p "   Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

echo "✅ Ready for Render deployment!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to your Git repository:"
echo "   git add ."
echo "   git commit -m 'Prepare for Render deployment'"
echo "   git push origin main"
echo ""
echo "2. Go to [render.com](https://render.com) and create a new Web Service"
echo "3. Connect your Git repository"
echo "4. Configure the service:"
echo "   - Name: crm-backend"
echo "   - Environment: Node"
echo "   - Build Command: npm install && npm run build && npx prisma generate"
echo "   - Start Command: npm start"
echo "   - Plan: Starter (recommended)"
echo ""
echo "5. Add environment variables in Render dashboard:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - JWT_REFRESH_SECRET"
echo "   - CORS_ORIGIN"
echo ""
echo "6. Deploy and test your API endpoints"
echo ""
echo "🎉 Your backend will be available at: https://your-service-name.onrender.com"
