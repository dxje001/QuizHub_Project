#!/bin/bash
# EC2 Setup Script for Microservices Deployment
# This script installs Docker and prepares the EC2 instance

set -e

echo "========================================="
echo "Setting up EC2 for Microservices"
echo "========================================="

# Update system
echo ""
echo "📦 Updating system packages..."
sudo apt-get update -qq

# Install Docker
echo ""
echo "🐳 Installing Docker..."
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Git (for potential code cloning)
echo ""
echo "📥 Installing Git..."
sudo apt-get install -y git curl

# Create application directory
echo ""
echo "📁 Creating application directory..."
mkdir -p /home/ubuntu/kvizhub
cd /home/ubuntu/kvizhub

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "1. Upload docker-compose file"
echo "2. Upload environment variables"
echo "3. Start microservices"
echo ""
