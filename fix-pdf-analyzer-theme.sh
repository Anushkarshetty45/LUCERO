#!/bin/bash

FILE="/Users/anushka/LUCERO./LUCERO/src/components/PDFAnalyzer/PDFAnalyzerModal.css"

# Fix upload button - remove hardcoded gradient
sed -i '' 's/background: linear-gradient(135deg, #ebeae8 0%, #d4d3d1 100%);/background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);/' "$FILE"
sed -i '' 's/color: white;$/color: white;/' "$FILE"

# Fix analyze button colors
sed -i '' 's/background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);/background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);/' "$FILE"

# Fix generate buttons
sed -i '' 's/background: rgba(102, 126, 234, 0\.15);/background: var(--bg-card-hover);/' "$FILE"
sed -i '' 's/border-bottom: 2px solid #667eea;/border-bottom: 2px solid var(--accent-primary);/' "$FILE"

# Fix progress bars
sed -i '' 's/border-top-color: #667eea;/border-top-color: var(--accent-primary);/' "$FILE"

# Fix message backgrounds
sed -i '' 's/background: rgba(102, 126, 234, 0\.1);/background: var(--bg-secondary);/' "$FILE"
sed -i '' 's/border: 1px solid rgba(102, 126, 234, 0\.2);/border: 1px solid var(--border-color);/' "$FILE"

# Fix active progress dot
sed -i '' 's/background: #667eea;/background: var(--accent-primary);/' "$FILE"

# Fix typing indicator
sed -i '' 's/background: #999;/background: var(--text-tertiary);/' "$FILE"

echo "✅ PDF Analyzer theme colors fixed!"
