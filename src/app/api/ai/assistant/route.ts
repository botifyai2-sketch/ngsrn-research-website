import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AssistantRequest {
  articleId: string;
  articleTitle: string;
  articleContent: string;
  question: string;
  conversationHistory: Message[];
}

export async function POST(request: NextRequest) {
  try {
    const { 
      articleId, 
      articleTitle, 
      articleContent, 
      question, 
      conversationHistory 
    }: AssistantRequest = await request.json();

    if (!question || !articleContent) {
      return NextResponse.json(
        { error: 'Question and article content are required' },
        { status: 400 }
      );
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .filter(msg => msg.role !== 'assistant' || !msg.content.includes('👋 Hello!'))
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Create a comprehensive prompt for Gemini
    const prompt = `You are the NGSRN Research Assistant, an AI helper for the NextGen Sustainable Research Network (NGSRN). Your role is to help readers understand research articles by answering questions, providing summaries, and explaining complex concepts.

ARTICLE INFORMATION:
Title: ${articleTitle}
Content: ${articleContent}

CONVERSATION HISTORY:
${conversationContext}

CURRENT USER QUESTION: ${question}

INSTRUCTIONS:
1. Answer questions based STRICTLY on the article content provided above
2. If the article doesn't contain information to answer the question, clearly state this limitation
3. Provide clear, concise, and policy-relevant responses
4. Use bullet points for lists and recommendations when appropriate
5. Keep responses under 300 words unless specifically asked for a detailed explanation
6. When explaining concepts, use simple, non-technical language
7. If you cannot answer based on the article content, suggest contacting the authors directly
8. Include relevant citations or references from the article when possible
9. Focus on policy implications and practical applications when relevant
10. Maintain a professional, academic tone while being accessible

RESPONSE GUIDELINES:
- For summaries: Provide 3-5 key points with practical implications
- For questions: Give direct answers with supporting evidence from the article
- For concept explanations: Use analogies and simple terms, then connect back to the article context
- Always stay within the scope of the provided article content

Please provide your response now:`;

    const response = await generateContent(prompt);

    // Ensure the response is appropriate and helpful
    if (!response || response.length < 10) {
      throw new Error('Generated response is too short or empty');
    }

    return NextResponse.json({ 
      response,
      articleId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Assistant API Error:', error);
    
    // Provide a helpful fallback response
    const fallbackResponse = `I apologize, but I'm having trouble processing your request right now. This could be due to:

• Temporary service unavailability
• High demand on the AI system
• Technical difficulties

**What you can do:**
• Try rephrasing your question
• Ask a more specific question about the article
• Contact the authors directly for detailed clarification

**For immediate help:** You can reach out to the NGSRN team at info@ngsrn.org for any questions about this research.`;

    return NextResponse.json({ 
      response: fallbackResponse,
      error: true,
      timestamp: new Date().toISOString()
    });
  }
}