import {
  Box, Flex, IconButton, Image, Text,
} from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { ImageAttachment } from '@/context/image-attachment-context';

export function ImageAttachmentStrip({
  attachments,
  onRemove,
  compact = false,
}: {
  attachments: ImageAttachment[];
  onRemove: (id: string) => void;
  compact?: boolean;
}): JSX.Element | null {
  const { t } = useTranslation();
  if (!attachments.length) return null;

  return (
    <Flex
      gap="1.5"
      minW="0"
      maxW="100%"
      overflowX="auto"
      overflowY="hidden"
      overscrollBehavior="contain"
      css={{ scrollbarWidth: 'thin', scrollbarColor: '#40505a transparent' }}
    >
      {attachments.map((attachment) => (
        <Flex
          key={attachment.id}
          align="center"
          gap="1.5"
          minW={compact ? '34px' : '112px'}
          maxW={compact ? '34px' : '180px'}
          h="32px"
          bg="#202a30"
          border="1px solid #3a4851"
          borderRadius="5px"
          overflow="hidden"
          position="relative"
          flexShrink={0}
        >
          <Image
            src={attachment.data}
            alt={attachment.name}
            boxSize="30px"
            objectFit="cover"
            flexShrink={0}
          />
          {!compact && (
            <Text
              minW="0"
              flex="1"
              pr="6"
              fontSize="2xs"
              color="#d9e1e5"
              truncate
              title={attachment.name}
            >
              {attachment.name}
            </Text>
          )}
          <IconButton
            aria-label={t('footer.removeAttachment', { name: attachment.name })}
            title={t('footer.removeAttachment', { name: attachment.name })}
            size="2xs"
            minW="18px"
            h="18px"
            position="absolute"
            top="1px"
            right="1px"
            borderRadius="4px"
            bg="rgba(8, 12, 14, 0.82)"
            color="#f0f4f6"
            _hover={{ bg: '#66363b', color: '#fff' }}
            onClick={() => onRemove(attachment.id)}
          >
            <Box as={LuX} boxSize="3" />
          </IconButton>
        </Flex>
      ))}
    </Flex>
  );
}
