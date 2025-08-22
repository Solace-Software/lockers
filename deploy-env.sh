#!/bin/bash
export SERVER_HOST="100.81.165.23"
export SERVER_USER="root"
export DB_ROOT_PASSWORD="SecureRoot2024!"
export DB_PASSWORD="SecureApp2024!"
export MQTT_USERNAME="gym_admin"
export MQTT_PASSWORD="SecureMqtt2024!"
export DOMAIN="100.81.165.23"

echo "Environment variables set for Tailscale deployment"
echo "Now run: ./deployment/deploy.sh production"
