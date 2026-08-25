import type {
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatbotError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    let errData: any = {};
    try {
      errData = await response.json();
    } catch {}
    const msg = errData.message || errData.error || response.statusText;
    const code = errData.code || "bad_request:api";
    throw new ChatbotError(code as ErrorCode, msg);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      let errData: any = {};
      try {
        errData = await response.json();
      } catch {}
      const msg = errData.message || errData.error || response.statusText;
      const code = errData.code || "bad_request:api";
      throw new ChatbotError(code as ErrorCode, msg);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatbotError('offline:chat');
    }

    throw error;
  }
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage | UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string}).text)
    .join('');
}

export async function downloadImage(url: string, filename = "mai-image.png") {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const isBase64 =
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("data:") &&
      !url.startsWith("blob:") &&
      !url.startsWith("/");
    const src = isBase64 ? `data:image/png;base64,${url}` : url;

    if (src.startsWith("data:") || src.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = src;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const response = await fetch(src, { mode: "cors" });
    if (!response.ok) {
      throw new Error("Fetch failed");
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    const isBase64 =
      !url.startsWith("http://") &&
      !url.startsWith("https://") &&
      !url.startsWith("data:") &&
      !url.startsWith("blob:") &&
      !url.startsWith("/");
    const src = isBase64 ? `data:image/png;base64,${url}` : url;
    const a = document.createElement("a");
    a.href = src;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export async function copyImageToClipboard(content: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  const isBase64 =
    !content.startsWith("http://") &&
    !content.startsWith("https://") &&
    !content.startsWith("data:") &&
    !content.startsWith("blob:") &&
    !content.startsWith("/");
  const src = isBase64 ? `data:image/png;base64,${content}` : content;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && window.ClipboardItem) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob }),
              ]);
              resolve(true);
              return;
            } catch {}
          }
          try {
            await navigator.clipboard.writeText(src);
            resolve(true);
          } catch {
            resolve(false);
          }
        }, "image/png");
      } catch {
        navigator.clipboard
          .writeText(src)
          .then(() => resolve(true))
          .catch(() => resolve(false));
      }
    };
    img.onerror = () => {
      navigator.clipboard
        .writeText(src)
        .then(() => resolve(true))
        .catch(() => resolve(false));
    };
    img.src = src;
  });
}
