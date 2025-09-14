#!/bin/bash

echo "🚀 Deploying Edge Functions to fix user management..."

# Deploy get-users function
echo "📤 Deploying get-users function..."
npx supabase functions deploy get-users

# Deploy update-user function  
echo "📤 Deploying update-user function..."
npx supabase functions deploy update-user

# Deploy create-user function
echo "📤 Deploying create-user function..."
npx supabase functions deploy create-user

# Deploy delete-user function
echo "📤 Deploying delete-user function..."
npx supabase functions deploy delete-user

echo "✅ All functions deployed successfully!"
echo "🔄 Please restart your development server: npm run dev"
