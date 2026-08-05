import ChatInterface from '@/components/chat/ChatInterface';

export const metadata = {
  title: 'AI Knowledge Base Chatbot',
  description: 'Ask questions based on uploaded PDF documents.',
};

export default function Home() {
  return <ChatInterface />;
}
