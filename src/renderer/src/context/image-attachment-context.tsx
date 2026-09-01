import {
  createContext, ReactNode, useContext, useMemo, useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/ui/toaster';

export const IMAGE_ATTACHMENT_ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';
const MAX_IMAGE_COUNT = 6;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

export interface ImageAttachment {
  id: string;
  name: string;
  source: 'upload';
  data: string;
  mimeType: string;
}

interface ImageAttachmentContextValue {
  attachments: ImageAttachment[];
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

const ImageAttachmentContext = createContext<ImageAttachmentContextValue | null>(null);

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export function ImageAttachmentProvider({ children }: { children: ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);

  const value = useMemo<ImageAttachmentContextValue>(() => ({
    attachments,
    addFiles: async (files) => {
      const available = Math.max(0, MAX_IMAGE_COUNT - attachments.length);
      if (!available) {
        toaster.create({
          title: t('footer.imageLimit', { count: MAX_IMAGE_COUNT }),
          type: 'warning',
          duration: 2400,
        });
        return;
      }

      const selected = Array.from(files).slice(0, available);
      const accepted = (await Promise.all(selected.map(async (
        file,
      ): Promise<ImageAttachment | null> => {
        if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
          toaster.create({
            title: t('footer.unsupportedImage', { name: file.name }),
            type: 'warning',
            duration: 2400,
          });
          return null;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          toaster.create({
            title: t('footer.imageTooLarge', { name: file.name }),
            type: 'warning',
            duration: 2400,
          });
          return null;
        }
        try {
          return {
            id: crypto.randomUUID(),
            name: file.name,
            source: 'upload',
            data: await readDataUrl(file),
            mimeType: file.type,
          };
        } catch {
          toaster.create({
            title: t('footer.failedImageRead', { name: file.name }),
            type: 'error',
            duration: 2400,
          });
          return null;
        }
      }))).filter((attachment): attachment is ImageAttachment => attachment !== null);

      if (Array.from(files).length > available) {
        toaster.create({
          title: t('footer.imageLimit', { count: MAX_IMAGE_COUNT }),
          type: 'warning',
          duration: 2400,
        });
      }
      if (accepted.length) {
        setAttachments((current) => (
          [...current, ...accepted].slice(0, MAX_IMAGE_COUNT)
        ));
      }
    },
    removeAttachment: (id) => {
      setAttachments((current) => current.filter((attachment) => attachment.id !== id));
    },
    clearAttachments: () => setAttachments([]),
  }), [attachments, t]);

  return (
    <ImageAttachmentContext.Provider value={value}>
      {children}
    </ImageAttachmentContext.Provider>
  );
}

export function useImageAttachments(): ImageAttachmentContextValue {
  const context = useContext(ImageAttachmentContext);
  if (!context) {
    throw new Error('useImageAttachments must be used within ImageAttachmentProvider');
  }
  return context;
}
