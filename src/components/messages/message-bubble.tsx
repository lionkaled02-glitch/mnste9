'use client';

import { MessageFiles } from './message-files';
import { stripFileLines } from '@/lib/utils/message-files';

interface MessageBubbleProps {
  message: {
    id: number;
    senderId: number;
    content: string;
    createdAt: Date | string;
  };
  isMe: boolean;
  pending?: boolean;
}

export function MessageBubble({ message, isMe, pending }: MessageBubbleProps) {
  return (
    <div className={`mb-3 flex ${isMe ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isMe ? 'bg-[#2386c8] text-white' : 'bg-slate-100 text-slate-800'
        } ${pending ? 'opacity-60' : ''}`}
      >
        <p className="whitespace-pre-wrap text-sm">
          {stripFileLines(message.content)}
        </p>
        <MessageFiles content={message.content} />
        <p
          className={`mt-1 text-[10px] ${
            isMe ? 'text-white/70' : 'text-slate-400'
          }`}
        >
          {pending
            ? '⏳'
            : new Date(message.createdAt).toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
              })}
        </p>
      </div>
    </div>
  );
}
