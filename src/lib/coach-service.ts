import { v4 as uuidv4 } from 'uuid';
import { Message, Conversation, ChatContext, QuickPrompt } from '@/types/coach';
import { openDB } from 'idb';

// Database configuration
const DB_NAME = 'workout-tracker';
const STORE_NAME = 'coach-conversations';
const DB_VERSION = 1;

// Initialize IndexedDB
async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create a store for coach conversations if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

// Predefined quick prompts for common coaching questions
export const quickPrompts: QuickPrompt[] = [
  {
    id: 'adjust-soreness',
    text: 'How should I adjust today\'s workout if I\'m sore?',
    context: { userIssue: 'soreness' }
  },
  {
    id: 'next-week-focus',
    text: 'What should I focus on improving next week?'
  },
  {
    id: 'short-time',
    text: 'Can you simplify today\'s workout if I\'m short on time?',
    context: { userIssue: 'time_constraint' }
  },
  {
    id: 'feeling-stronger',
    text: 'I\'m feeling stronger than the program allows'
  },
  {
    id: 'exercise-discomfort',
    text: 'This exercise is causing discomfort',
    context: { userIssue: 'other' }
  },
  {
    id: 'plateau',
    text: 'Suggest a plateau-breaking strategy'
  }
];

/**
 * Creates a new conversation
 * @param initialMessage Initial user message (optional)
 * @param context Additional context for the conversation
 * @returns A promise resolving to the new conversation
 */
export async function createConversation(
  initialMessage?: string,
  context: ChatContext = {}
): Promise<Conversation> {
  const now = Date.now();
  
  const conversation: Conversation = {
    id: uuidv4(),
    title: initialMessage ? initialMessage.substring(0, 30) + '...' : 'New Conversation',
    messages: [],
    context,
    createdAt: now,
    updatedAt: now
  };
  
  // Add initial message if provided
  if (initialMessage) {
    const message: Message = {
      id: uuidv4(),
      role: 'user',
      content: initialMessage,
      timestamp: now
    };
    
    conversation.messages.push(message);
  }
  
  // Save to IndexedDB
  const db = await getDB();
  await db.put(STORE_NAME, conversation);
  
  return conversation;
}

/**
 * Adds a message to a conversation
 * @param conversationId The ID of the conversation
 * @param role The role of the message sender
 * @param content The message content
 * @returns A promise resolving to the new message
 */
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message> {
  const db = await getDB();
  
  // Get the conversation
  const conversation = await db.get(STORE_NAME, conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
  
  // Create a new message
  const message: Message = {
    id: uuidv4(),
    role,
    content,
    timestamp: Date.now()
  };
  
  // Add the message to the conversation
  conversation.messages.push(message);
  conversation.updatedAt = message.timestamp;
  
  // Update the conversation title if it's the first user message
  if (role === 'user' && conversation.messages.filter((m: Message) => m.role === 'user').length === 1) {
    conversation.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }
  
  // Save the updated conversation
  await db.put(STORE_NAME, conversation);
  
  return message;
}

/**
 * Updates the context for a conversation
 * @param conversationId The ID of the conversation
 * @param context The new context (will be merged with existing)
 * @returns A promise resolving when the update is complete
 */
export async function updateContext(
  conversationId: string,
  context: Partial<ChatContext>
): Promise<void> {
  const db = await getDB();
  
  // Get the conversation
  const conversation = await db.get(STORE_NAME, conversationId);
  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }
  
  // Update the context
  conversation.context = {
    ...conversation.context,
    ...context
  };
  
  conversation.updatedAt = Date.now();
  
  // Save the updated conversation
  await db.put(STORE_NAME, conversation);
}

/**
 * Gets a conversation by ID
 * @param conversationId The ID of the conversation
 * @returns A promise resolving to the conversation or null if not found
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const db = await getDB();
  return db.get(STORE_NAME, conversationId);
}

/**
 * Gets all conversations
 * @returns A promise resolving to an array of conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * Deletes a conversation
 * @param conversationId The ID of the conversation to delete
 * @returns A promise resolving when the deletion is complete
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, conversationId);
} 