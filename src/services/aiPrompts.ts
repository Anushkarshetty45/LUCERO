// AI Prompts for PDF Analyzer Features

export const generateAnalysisPrompt = (pdfContent: string) => `
You are a helpful AI assistant that analyzes documents. I have extracted text from a PDF document. Please provide a well-organized analysis.

Here is the document text:

${pdfContent}

Please format your response EXACTLY as follows:

## SUMMARY

Write 2-3 clear, well-structured paragraphs summarizing the main points of the document.

Use proper paragraph spacing (double line breaks between paragraphs).

## EXPLANATION

### Key Topics

• **Topic 1**: Explanation here
  ◦ Sub-point with details
  ◦ Another sub-point

• **Topic 2**: Explanation here
  ◦ Sub-point with details
  ◦ Another sub-point

### Important Concepts

• **Concept 1**: Clear explanation
  ◦ Supporting detail
  ◦ Example or clarification

• **Concept 2**: Clear explanation
  ◦ Supporting detail
  ◦ Example or clarification

### Main Takeaways

• Key point 1
• Key point 2
• Key point 3

FORMATTING RULES:
- Use **bold** for important terms and headings
- Use bullet points (•) for main points
- Use sub-bullets (◦) for supporting details
- Add blank lines between sections for readability
- Keep explanations clear and concise
- Organize content with proper headings (###)
`

export const generateFlashcardsPrompt = (pdfContent: string) => `
Analyze this PDF content and create educational flashcards.

Content:
${pdfContent}

Generate 10-15 flashcards in this EXACT JSON format (return ONLY valid JSON, no other text):
{
  "flashcards": [
    {
      "front": "What is [concept]?",
      "back": "Clear, concise answer explaining the concept",
      "category": "Key Concept"
    },
    {
      "front": "Define [term]",
      "back": "Precise definition",
      "category": "Definition"
    }
  ]
}

Categories to use: "Key Concept", "Definition", "Example", "Process", "Important Fact", "Formula"

Guidelines:
- Front should be a clear question or prompt
- Back should be a concise, complete answer
- Include important concepts, definitions, and key facts
- Mix different types of flashcards (concepts, definitions, examples)
- Make answers specific and actionable
`

export const generateQuizPrompt = (pdfContent: string) => `
Create a comprehensive quiz based on this PDF content:

${pdfContent}

Generate 10 multiple-choice questions in this EXACT JSON format (return ONLY valid JSON):
{
  "questions": [
    {
      "question": "Clear question about the content?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "A",
      "explanation": "Why option A is correct and others are incorrect",
      "difficulty": "medium"
    }
  ]
}

Requirements:
- Mix difficulty levels: 3 easy, 5 medium, 2 hard
- Easy: Basic recall and definitions
- Medium: Application and understanding
- Hard: Analysis and synthesis
- Each question should have 4 options (A, B, C, D)
- Correct answer should be just the letter (A, B, C, or D)
- Explanation should clarify why the answer is correct
- Cover different sections of the content
`

export const generateMindMapPrompt = (pdfContent: string) => `
Analyze this content and create a mind map structure showing relationships between concepts:

${pdfContent}

Return ONLY valid JSON in this format (no other text):
{
  "central_topic": "Main Topic Name",
  "branches": [
    {
      "topic": "Major Branch 1",
      "subtopics": ["Subtopic 1.1", "Subtopic 1.2", "Subtopic 1.3"]
    },
    {
      "topic": "Major Branch 2",
      "subtopics": ["Subtopic 2.1", "Subtopic 2.2"]
    }
  ]
}

Guidelines:
- Central topic should be the main theme
- Create 4-6 major branches
- Each branch should have 2-5 subtopics
- Keep labels concise (1-5 words)
- Organize logically by theme or sequence
`

export const generateStudyPlanPrompt = (pdfContent: string, durationDays: number) => `
Create a ${durationDays}-day study plan for mastering this content:

${pdfContent}

Return ONLY valid JSON in this format:
{
  "days": [
    {
      "day": 1,
      "topics": ["Topic to study"],
      "activities": ["Read section X (30 min)", "Summarize key points (15 min)", "Practice problems (20 min)"],
      "estimated_time": "1.5 hours"
    }
  ],
  "milestones": ["Complete chapter 1 by day 3", "Practice quiz by day 5"],
  "tips": ["Study tip 1", "Study tip 2", "Study tip 3"]
}

Requirements:
- Distribute content evenly across ${durationDays} days
- Each day should have specific topics and activities
- Activities should include time estimates in parentheses
- Total daily time should be realistic (1-3 hours)
- Include review days and practice sessions
- Milestones should mark key completion points
- Tips should be practical and actionable
- Build gradually from basics to advanced
`

export const generateKeyTermsPrompt = (pdfContent: string) => `
Extract and define the most important terms from this document:

${pdfContent}

Return ONLY valid JSON in this format:
{
  "terms": [
    {
      "term": "Term name",
      "definition": "Clear, concise definition",
      "category": "Category name"
    }
  ]
}

Guidelines:
- Extract 10-15 most important terms
- Definitions should be clear and concise (1-2 sentences)
- Categories: "Concept", "Method", "Theory", "Tool", "Process", "Principle"
- Order by importance or appearance in document
- Include technical terms and key concepts
`

export const generateChatPrompt = (pdfContent: string, conversationHistory: Array<{ role: string; content: string }>, userQuestion: string) => `
You are an AI assistant analyzing a PDF document. Answer the user's question based on the document content.

Document content:
${pdfContent.substring(0, 15000)}

Conversation history:
${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

User question: ${userQuestion}

Instructions:
- Answer based on the document content
- Be concise and clear (2-3 paragraphs maximum)
- Use bullet points for lists
- Reference specific sections when relevant
- If the answer isn't in the document, say so
- Be helpful and conversational
`

export const generateTranslationPrompt = (text: string, targetLanguage: string) => `
Translate the following text to ${targetLanguage}. Maintain all formatting, structure, bullet points, and emphasis (bold/italic).

Text to translate:
${text}

Return ONLY the translated text, preserving all markdown formatting.
`

export const generateCitationPrompt = (pdfContent: string, fileName: string) => `
Based on this PDF content and filename, generate citations in multiple formats:

Filename: ${fileName}
Content (first page):
${pdfContent.substring(0, 2000)}

Return ONLY valid JSON:
{
  "apa": "Author, A. A. (Year). Title. Publisher.",
  "mla": "Author. Title. Publisher, Year.",
  "chicago": "Author. Title. Publisher, Year.",
  "metadata": {
    "title": "Extracted title",
    "author": "Extracted author",
    "year": "Extracted year",
    "publisher": "Extracted publisher"
  }
}

Extract metadata from the content if available. If metadata cannot be determined, use placeholder values and indicate with [Unknown].
`

export const generateProgressiveSummaryPrompt = (pdfContent: string, level: 'quick' | 'standard' | 'detailed') => {
  const levelInstructions = {
    quick: 'Provide a 2-3 sentence summary of the absolute key points.',
    standard: 'Provide 2-3 paragraphs covering the main ideas and important details.',
    detailed: 'Provide a comprehensive analysis with 4-6 paragraphs, covering all major topics, subtopics, and important details.'
  }

  return `
Analyze this PDF content and create a ${level} summary:

${pdfContent}

${levelInstructions[level]}

Format with proper paragraphs and bullet points where appropriate.
`
}
