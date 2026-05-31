import type { ChatConversation } from '../types/chat';

export const mockConversations: ChatConversation[] = [
  {
    id: 'rag-review',
    title: 'RAG pipeline review',
    subtitle: 'Chunking, embeddings, and retrieval notes',
    updatedAt: '10:42 AM',
    tags: ['Backend', 'RAG', 'Vector search'],
    messages: [
      {
        id: 'msg-1',
        role: 'assistant',
        content:
          'Here is the current shape of the pipeline: upload PDF, extract text, chunk, embed, and store vectors for retrieval.',
        timestamp: '10:18 AM',
      },
      {
        id: 'msg-2',
        role: 'user',
        content:
          'Can we make the retrieval answers feel more conversational and better grounded in the source documents?',
        timestamp: '10:21 AM',
      },
      {
        id: 'msg-3',
        role: 'assistant',
        content:
          'Yes. The simplest improvement is to add a short synthesis step after retrieval, keep citations visible, and bias the prompt toward direct answers with explicit uncertainty when evidence is thin.',
        timestamp: '10:22 AM',
      },
    ],
  },
  {
    id: 'frontend-shell',
    title: 'Frontend shell ideas',
    subtitle: 'Dark layout with sidebar and chat stream',
    updatedAt: '9:11 AM',
    tags: ['React', 'Vite', 'UI'],
    messages: [
      {
        id: 'msg-4',
        role: 'user',
        content: 'I want the interface to feel close to a modern chat product.',
        timestamp: '9:02 AM',
      },
      {
        id: 'msg-5',
        role: 'assistant',
        content:
          'Use a fixed sidebar, a narrow top rail, large message padding, and subtle contrast instead of strong borders. That keeps the layout functional without looking generic.',
        timestamp: '9:04 AM',
      },
    ],
  },
  {
    id: 'project-plan',
    title: 'Project plan',
    subtitle: 'Next steps for backend API integration',
    updatedAt: 'Yesterday',
    tags: ['Planning', 'API', 'Tasks'],
    messages: [
      {
        id: 'msg-6',
        role: 'assistant',
        content:
          'Once the frontend shell is in place, we can wire the upload flow, document list, and chat responses to the backend endpoints one slice at a time.',
        timestamp: 'Yesterday',
      },
    ],
  },
];

export const defaultWelcomeMessage =
  'You are now chatting inside the mock RAG workspace. Ask a question, draft a follow-up, or add a new thread from the sidebar.';