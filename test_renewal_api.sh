#!/bin/bash

echo "=== Testing Renewal Quote API Endpoints ==="
echo ""

# Test 1: Get auth token
echo "Test 1: Authenticate (get auth token)..."
AUTH=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@localhost","password":"password123"}' \
  -c /tmp/cookies.txt)
echo "Auth response: ${AUTH:0:200}..."
echo ""

# Test 2: Get renewals list
echo "Test 2: Get Renewals List..."
RENEWALS=$(curl -s -X GET "http://localhost:3000/api/renewals?pageIndex=0&pageSize=10" \
  -b /tmp/cookies.txt \
  -H "Accept: application/json")
echo "Renewals response: ${RENEWALS:0:300}..."
echo ""

# Test 3: Get a specific submission (if we have a renewal policy ID)
echo "Test 3: Extract first renewal policy ID from list..."
RENEWAL_ID=$(echo "$RENEWALS" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*' | head -1)
if [ -n "$RENEWAL_ID" ]; then
  echo "Found renewal policy ID: $RENEWAL_ID"
  echo ""
  echo "Test 4: Get submission by renewal policy ID..."
  SUBMISSION=$(curl -s -X GET "http://localhost:3000/api/submissions/$RENEWAL_ID" \
    -b /tmp/cookies.txt \
    -H "Accept: application/json")
  echo "Submission response: ${SUBMISSION:0:500}..."
  echo ""
  echo "Checking if response contains 'isRenewal' flag..."
  if echo "$SUBMISSION" | grep -q "isRenewal"; then
    echo "✅ SUCCESS: isRenewal flag found in submission data!"
  else
    echo "❌ FAILED: isRenewal flag not found - check BuildRenewalFormDataJsonAsync"
  fi
else
  echo "⚠️  No renewal policies found in list"
fi
