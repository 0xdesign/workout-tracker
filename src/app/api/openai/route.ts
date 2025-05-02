import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Extract request data
    const requestData = await request.json();
    const { messages, model = 'gpt-4o', temperature = 0.5, max_tokens = 2000 } = requestData;
    
    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured on the server' },
        { status: 500 }
      );
    }
    
    // Forward request to OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages
      })
    });
    
    // Handle OpenAI API errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      
      return NextResponse.json(
        { 
          error: `OpenAI API error: ${response.status} ${response.statusText}`,
          details: errorData
        },
        { status: response.status }
      );
    }
    
    // Return the OpenAI response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in OpenAI API route:', error);
    return NextResponse.json(
      { error: 'Internal server error processing OpenAI request' },
      { status: 500 }
    );
  }
} 