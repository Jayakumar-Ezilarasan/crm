#!/bin/bash

# CRM Backend Diagnostic Script
# This script helps diagnose 502 Bad Gateway errors

echo "🔍 CRM Backend Diagnostic Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend URL
BACKEND_URL="https://crm-nnzk.onrender.com"

echo -e "\n${YELLOW}1. Testing Backend Health Endpoint${NC}"
echo "----------------------------------------"

# Test health endpoint
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)

if [ "$HEALTH_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Health endpoint is responding (200)${NC}"
    echo "Response: $HEALTH_BODY"
else
    echo -e "${RED}❌ Health endpoint failed (Status: $HEALTH_CODE)${NC}"
    echo "Response: $HEALTH_BODY"
fi

echo -e "\n${YELLOW}2. Testing Root Endpoint${NC}"
echo "-----------------------------"

# Test root endpoint
ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/")
ROOT_CODE=$(echo "$ROOT_RESPONSE" | tail -n1)
ROOT_BODY=$(echo "$ROOT_RESPONSE" | head -n -1)

if [ "$ROOT_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Root endpoint is responding (200)${NC}"
    echo "Response: $ROOT_BODY"
else
    echo -e "${RED}❌ Root endpoint failed (Status: $ROOT_CODE)${NC}"
    echo "Response: $ROOT_BODY"
fi

echo -e "\n${YELLOW}3. Testing CORS Preflight${NC}"
echo "--------------------------------"

# Test CORS preflight
CORS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X OPTIONS \
    -H "Origin: https://crm-2sqn.vercel.app" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    "$BACKEND_URL/auth/login")
CORS_CODE=$(echo "$CORS_RESPONSE" | tail -n1)

if [ "$CORS_CODE" -eq 200 ] || [ "$CORS_CODE" -eq 204 ]; then
    echo -e "${GREEN}✅ CORS preflight is working (Status: $CORS_CODE)${NC}"
else
    echo -e "${YELLOW}⚠️ CORS preflight returned status: $CORS_CODE${NC}"
fi

echo -e "\n${YELLOW}4. Testing Database Connection${NC}"
echo "------------------------------------"

# Test database connection by checking if health endpoint includes database info
if echo "$HEALTH_BODY" | grep -q "database"; then
    echo -e "${GREEN}✅ Database connection appears to be working${NC}"
else
    echo -e "${YELLOW}⚠️ Database connection status unknown${NC}"
fi

echo -e "\n${YELLOW}5. Checking Response Times${NC}"
echo "-------------------------------"

# Test response time
START_TIME=$(date +%s.%N)
curl -s "$BACKEND_URL/health" > /dev/null
END_TIME=$(date +%s.%N)

RESPONSE_TIME=$(echo "$END_TIME - $START_TIME" | bc -l)
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc -l)

if (( $(echo "$RESPONSE_TIME_MS < 1000" | bc -l) )); then
    echo -e "${GREEN}✅ Response time: ${RESPONSE_TIME_MS}ms (Good)${NC}"
elif (( $(echo "$RESPONSE_TIME_MS < 5000" | bc -l) )); then
    echo -e "${YELLOW}⚠️ Response time: ${RESPONSE_TIME_MS}ms (Slow)${NC}"
else
    echo -e "${RED}❌ Response time: ${RESPONSE_TIME_MS}ms (Very Slow)${NC}"
fi

echo -e "\n${YELLOW}6. Summary${NC}"
echo "---------"

if [ "$HEALTH_CODE" -eq 200 ] && [ "$ROOT_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Backend appears to be working correctly${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Check browser console for JavaScript errors"
    echo "2. Verify frontend API URL configuration"
    echo "3. Check network tab for request/response details"
else
    echo -e "${RED}❌ Backend is experiencing issues${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Check Render dashboard for service status"
    echo "2. Review application logs in Render"
    echo "3. Verify environment variables are set correctly"
    echo "4. Check database connection"
    echo "5. Restart the service if necessary"
fi

echo -e "\n${YELLOW}7. Manual Testing Commands${NC}"
echo "--------------------------------"
echo "Test health endpoint:"
echo "  curl -v $BACKEND_URL/health"
echo ""
echo "Test login endpoint:"
echo "  curl -X POST \\"
echo "    -H \"Content-Type: application/json\" \\"
echo "    -d '{\"email\":\"test@example.com\",\"password\":\"password123\"}' \\"
echo "    $BACKEND_URL/auth/login"
echo ""
echo "Test CORS:"
echo "  curl -X OPTIONS \\"
echo "    -H \"Origin: https://crm-2sqn.vercel.app\" \\"
echo "    -H \"Access-Control-Request-Method: POST\" \\"
echo "    -H \"Access-Control-Request-Headers: Content-Type\" \\"
echo "    $BACKEND_URL/auth/login"

echo -e "\n${YELLOW}8. Render Dashboard Actions${NC}"
echo "--------------------------------"
echo "1. Go to: https://dashboard.render.com"
echo "2. Find your 'crm-nnzk' service"
echo "3. Check 'Logs' tab for error messages"
echo "4. Check 'Events' tab for deployment status"
echo "5. Verify 'Environment' variables are set"
echo "6. Click 'Manual Deploy' if needed"

echo -e "\n🔍 Diagnostic complete!"
