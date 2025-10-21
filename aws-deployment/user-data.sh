#!/bin/bash
apt-get update
apt-get install -y docker.io docker-compose git curl
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu
mkdir -p /home/ubuntu/kvizhub
chown ubuntu:ubuntu /home/ubuntu/kvizhub
echo "Docker setup complete" > /home/ubuntu/setup-complete.txt