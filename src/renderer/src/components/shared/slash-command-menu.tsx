import {
  Box, Button, Flex, Icon, Text,
} from '@chakra-ui/react';
import { LuCommand, LuSparkles, LuWrench } from 'react-icons/lu';
import { RuntimeCommand } from '@/hooks/sidebar/setting/use-agent-settings';

interface SlashCommandMenuProps {
  commands: RuntimeCommand[];
  selectedIndex: number;
  onSelect: (command: RuntimeCommand) => void;
  onHighlight: (index: number) => void;
}

function sourceIcon(source: string) {
  if (source === 'skill') return LuSparkles;
  if (source === 'mcp') return LuWrench;
  return LuCommand;
}

export function SlashCommandMenu({
  commands,
  selectedIndex,
  onSelect,
  onHighlight,
}: SlashCommandMenuProps): JSX.Element {
  return (
    <Box
      data-testid="slash-command-menu"
      position="absolute"
      left="0"
      right="0"
      bottom="calc(100% + 8px)"
      maxH="280px"
      overflowY="auto"
      overflowX="hidden"
      bg="rgba(13, 18, 22, 0.98)"
      border="1px solid #35434d"
      borderRadius="7px"
      boxShadow="0 18px 48px rgba(0, 0, 0, 0.48)"
      backdropFilter="blur(18px)"
      p="1.5"
      zIndex={1200}
    >
      {commands.map((command, index) => {
        const SourceIcon = sourceIcon(command.source);
        return (
          <Button
            key={`${command.runtime}-${command.source}-${command.name}`}
            width="full"
            minW="0"
            height="auto"
            alignItems="flex-start"
            justifyContent="flex-start"
            gap="2.5"
            px="2.5"
            py="2"
            borderRadius="5px"
            textAlign="left"
            overflow="hidden"
            bg={index === selectedIndex ? '#25313a' : 'transparent'}
            color="#e3e9ed"
            _hover={{ bg: '#25313a' }}
            variant="ghost"
            onMouseEnter={() => onHighlight(index)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(command)}
          >
            <Icon as={SourceIcon} boxSize="4" color="#9fb9cc" mt="0.5" flexShrink={0} />
            <Box minW="0" flex="1">
              <Flex align="baseline" gap="2" minW="0">
                <Text
                  minW="0"
                  fontFamily="mono"
                  fontSize="xs"
                  fontWeight="semibold"
                  color="#eaf2f7"
                  whiteSpace="normal"
                  overflowWrap="anywhere"
                >
                  /
                  {command.name}
                </Text>
                <Text fontSize="2xs" color="#71818c" textTransform="uppercase">
                  {command.source}
                </Text>
              </Flex>
              <Text
                fontSize="xs"
                color="#9eabb4"
                lineHeight="1.45"
                mt="0.5"
                whiteSpace="normal"
                overflowWrap="anywhere"
              >
                {command.description}
              </Text>
            </Box>
          </Button>
        );
      })}
    </Box>
  );
}
