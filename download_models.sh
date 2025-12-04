#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p public/models

echo "⬇️  Downloading face-api.js models..."

# Base URL for models
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# List of required model files
FILES=(
  "tiny_face_detector_model-weights_manifest.json"
  "tiny_face_detector_model-shard1"
  "face_landmark_68_tiny_model-weights_manifest.json"
  "face_landmark_68_tiny_model-shard1"
)

# Download each file
for file in "${FILES[@]}"; do
  echo "Downloading $file..."
  curl -L -o "public/models/$file" "$BASE_URL/$file"
done

echo "✅ All models downloaded successfully!"
echo "🔄 Please refresh your browser to enable full face detection."
