#!/bin/bash

# Test build script for Vercel deployment
echo "========================================="
echo "🔧 Testing Next.js Build for Vercel"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📋 Checking environment..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo ""
echo "🔍 Running TypeScript type check..."
npx tsc --noEmit
TSC_EXIT_CODE=$?

if [ $TSC_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${RED}❌ TypeScript check failed${NC}"
fi

echo ""
echo "🏗️ Running Next.js build..."
npm run build
BUILD_EXIT_CODE=$?

echo ""
echo "========================================="
echo "📊 Build Test Results:"
echo "========================================="

if [ $TSC_EXIT_CODE -eq 0 ] && [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All checks passed! Ready for Vercel deployment.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Push to GitHub"
    echo "2. Connect repo to Vercel"
    echo "3. Add environment variables in Vercel:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - DATABASE_URL"
else
    echo -e "${RED}❌ Build failed. Please fix the errors above.${NC}"
    echo ""
    if [ $TSC_EXIT_CODE -ne 0 ]; then
        echo "- TypeScript type checking failed"
    fi
    if [ $BUILD_EXIT_CODE -ne 0 ]; then
        echo "- Next.js build failed"
    fi
fi

echo "========================================="
exit $((TSC_EXIT_CODE + BUILD_EXIT_CODE))