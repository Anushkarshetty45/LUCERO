#!/bin/bash

# Fix ForestLeaves.css - increase visibility
sed -i '' 's/z-index: 0;/z-index: 1;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/ForestLeaves.css
sed -i '' 's/opacity: 0\.4;/opacity: 0.6;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/ForestLeaves.css
sed -i '' 's/opacity: 0\.6;/opacity: 0.75;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/ForestLeaves.css

# Fix FlowerPetals.css - increase visibility  
sed -i '' 's/z-index: 0;/z-index: 1;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/FlowerPetals.css
sed -i '' 's/opacity: 0\.5;/opacity: 0.7;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/FlowerPetals.css
sed -i '' 's/opacity: 0\.7;/opacity: 0.85;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/FlowerPetals.css

# Fix LavenderBlossoms.css - increase visibility
sed -i '' 's/z-index: 0;/z-index: 1;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/LavenderBlossoms.css
sed -i '' 's/opacity: 0\.45;/opacity: 0.65;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/LavenderBlossoms.css
sed -i '' 's/opacity: 0\.65;/opacity: 0.8;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/LavenderBlossoms.css

# Fix SunsetGlow.css - increase visibility
sed -i '' 's/z-index: 0;/z-index: 1;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/SunsetGlow.css
sed -i '' 's/opacity: 0\.35;/opacity: 0.5;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/SunsetGlow.css
sed -i '' 's/opacity: 0\.5;/opacity: 0.65;/' /Users/anushka/LUCERO./LUCERO/src/components/BackgroundParticles/SunsetGlow.css

echo "✓ Animation visibility increased"
