#!/bin/bash
# Check if verification worker is processing jobs

cd c:\Users\RAJ\OneDrive\Desktop\micro-job-ai-agent-web3\server

echo "📋 Checking for payments with pending status..."
echo ""
echo "SELECT id, task_id, worker_id, amount, transaction_hash, status, created_at FROM payments ORDER BY created_at DESC LIMIT 10;" | psql "$DATABASE_URL" 2>/dev/null || echo "⚠️  Could not query database directly"

echo ""
echo "📝 Checking submissions with pending verification status..."
echo "SELECT id, task_id, worker_id, verification_status, created_at FROM submissions ORDER BY created_at DESC LIMIT 10;" | psql "$DATABASE_URL" 2>/dev/null || echo "⚠️  Could not query database directly"
