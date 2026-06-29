import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'dompurify';

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      'p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'table',
      'thead', 'tbody', 'tr', 'th', 'td', 'code', 'pre', 'h1', 'h2',
      'h3', 'br', 'hr', 'blockquote'
    ],
    ALLOWED_ATTR: ['href', 'title'],
  });

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {sanitized}
    </ReactMarkdown>
  );
}
