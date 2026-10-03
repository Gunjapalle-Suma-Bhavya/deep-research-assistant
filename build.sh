#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Upgrading pip..."
python -m pip install --upgrade pip

echo "==> Installing Python dependencies..."
pip install -r requirements.txt

echo "==> Building React Frontend SPA..."
cd frontend
npm install
npm run build
cd ..

echo "==> Build successfully completed!"
