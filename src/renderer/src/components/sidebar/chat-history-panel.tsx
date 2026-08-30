/* eslint-disable import/no-extraneous-dependencies */
import {
  Avatar,
  Badge,
  Box,
  Flex,
  Icon,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HiCheckCircle,
  HiChatBubbleLeftRight,
  HiCpuChip,
  HiExclamationCircle,
  HiWrenchScrewdriver,
} from "react-icons/hi2";
import { useChatHistory } from "@/context/chat-history-context";
import { useConfig } from "@/context/character-config-context";
import { useWebSocket } from "@/context/websocket-context";
import { Message } from "@/services/websocket-service";

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MessageAvatar({
  name,
  src,
  kind,
}: {
  name: string;
  src?: string;
  kind: "ai" | "human";
}): JSX.Element {
  const [failed, setFailed] = useState(false);
  return (
    <Avatar.Root
      size="sm"
      width="30px"
      height="30px"
      flexShrink="0"
      bg={kind === "ai" ? "#203342" : "#2b3935"}
      color={kind === "ai" ? "#a9d5f5" : "#b8ddd0"}
      border="1px solid"
      borderColor={kind === "ai" ? "#345066" : "#3b524a"}
    >
      <Avatar.Fallback fontSize="xs" fontWeight="semibold">
        {name.trim().charAt(0).toUpperCase() || "A"}
      </Avatar.Fallback>
      {src && !failed && (
        <Avatar.Image src={src} alt={name} onError={() => setFailed(true)} />
      )}
    </Avatar.Root>
  );
}

function ReasoningMessage({ message }: { message: Message }): JSX.Element {
  const { t } = useTranslation();
  return (
    <Box ml="10" mr="2" py="2" pl="3" borderLeft="2px solid #55738a">
      <Flex align="center" gap="2" minW="0">
        {message.status === "running" ? (
          <Spinner size="xs" color="#86a8c0" />
        ) : (
          <Icon as={HiCpuChip} color="#86a8c0" flexShrink="0" />
        )}
        <Text color="#90a5b5" fontSize="2xs" fontWeight="semibold">
          {message.status === "running"
            ? t("sidebar.thinking")
            : t("sidebar.reasoning")}
        </Text>
        <Text color="#596873" fontSize="2xs" ml="auto" flexShrink="0">
          {formatTime(message.timestamp)}
        </Text>
      </Flex>
      {message.content && (
        <Text
          color="#aeb9c1"
          fontSize="xs"
          lineHeight="1.65"
          whiteSpace="pre-wrap"
          overflowWrap="anywhere"
          mt="1.5"
        >
          {message.content}
        </Text>
      )}
    </Box>
  );
}

function ToolMessage({ message }: { message: Message }): JSX.Element {
  const { t } = useTranslation();
  const label = (() => {
    if (message.status === "running") return t("sidebar.toolRunning", { tool: message.tool_name });
    if (message.status === "error") return t("sidebar.toolFailed", { tool: message.tool_name });
    return t("sidebar.toolCompleted", { tool: message.tool_name });
  })();
  const statusIcon = (() => {
    if (message.status === "running") return <Spinner size="xs" color="#9db4c3" />;
    if (message.status === "error") return <Icon as={HiExclamationCircle} color="#ef8a90" />;
    return <Icon as={HiCheckCircle} color="#72d6a2" />;
  })();
  return (
    <Flex
      ml="10"
      mr="2"
      align="center"
      gap="2"
      minW="0"
      border="1px solid #28343c"
      borderRadius="6px"
      bg="#12191d"
      px="3"
      py="2"
    >
      <Icon as={HiWrenchScrewdriver} color="#7f98a9" flexShrink="0" />
      <Text color="#aeb9c1" fontSize="xs" lineHeight="1.4" overflowWrap="anywhere">
        {label}
      </Text>
      <Box ml="auto" flexShrink="0">{statusIcon}</Box>
    </Flex>
  );
}

function ChatHistoryPanel(): JSX.Element {
  const { t } = useTranslation();
  const { messages } = useChatHistory();
  const { confName } = useConfig();
  const { baseUrl } = useWebSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const validMessages = useMemo(
    () => messages.filter((message) => (
      Boolean(message.content)
      || message.type === "reasoning"
      || message.type === "tool_call_status"
    )),
    [messages],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [validMessages]);

  return (
    <Flex h="full" minW="0" overflow="hidden" bg="#0c1114" direction="column">
      <Flex
        align="center"
        justify="space-between"
        gap="3"
        px="4"
        py="3"
        borderBottom="1px solid #222c32"
        bg="#10161a"
      >
        <Box minW="0">
          <Text color="#edf1f4" fontSize="sm" fontWeight="semibold" lineHeight="1.3">
            {confName || t("sidebar.conversation")}
          </Text>
          <Text color="#73808a" fontSize="2xs" mt="0.5">
            {t("sidebar.messageCount", { count: validMessages.length })}
          </Text>
        </Box>
        <Badge
          variant="subtle"
          colorPalette="green"
          borderRadius="4px"
          px="2"
          flexShrink="0"
        >
          {t("sidebar.live")}
        </Badge>
      </Flex>

      <Box
        ref={scrollRef}
        flex="1"
        minH="0"
        overflowY="auto"
        overflowX="hidden"
        px="3"
        py="4"
        css={{
          scrollbarWidth: "thin",
          scrollbarColor: "#35414a transparent",
        }}
      >
        {validMessages.length === 0 ? (
          <Flex
            h="full"
            minH="220px"
            align="center"
            justify="center"
            direction="column"
            color="#77838d"
            textAlign="center"
            px="6"
          >
            <Flex
              align="center"
              justify="center"
              width="10"
              height="10"
              border="1px solid #2c3840"
              borderRadius="7px"
              bg="#12191d"
              mb="3"
            >
              <HiChatBubbleLeftRight />
            </Flex>
            <Text fontSize="sm" lineHeight="1.55" overflowWrap="anywhere">
              {t("sidebar.noMessages")}
            </Text>
          </Flex>
        ) : (
          <Stack gap="3.5">
            {validMessages.map((message) => {
              if (message.type === "reasoning") {
                return <ReasoningMessage key={message.id} message={message} />;
              }
              if (message.type === "tool_call_status") {
                return <ToolMessage key={message.id} message={message} />;
              }

              const isAI = message.role === "ai";
              const name = isAI ? (message.name || confName || "AI") : t("sidebar.you");
              const avatar = isAI && message.avatar
                ? `${baseUrl}/avatars/${message.avatar}`
                : undefined;
              return (
                <Flex
                  key={message.id}
                  justify={isAI ? "flex-start" : "flex-end"}
                  align="flex-start"
                  gap="2.5"
                  minW="0"
                >
                  {isAI && <MessageAvatar name={name} src={avatar} kind="ai" />}
                  <Box maxW="82%" minW="0">
                    <Flex
                      align="center"
                      justify={isAI ? "flex-start" : "flex-end"}
                      gap="2"
                      mb="1"
                    >
                      <Text color="#98a5ae" fontSize="2xs" fontWeight="semibold">
                        {name}
                      </Text>
                      <Text color="#56636c" fontSize="2xs">
                        {formatTime(message.timestamp)}
                      </Text>
                    </Flex>
                    <Box
                      border="1px solid"
                      borderColor={isAI ? "#293740" : "#374a43"}
                      borderLeftWidth={isAI ? "3px" : "1px"}
                      borderRightWidth={isAI ? "1px" : "3px"}
                      bg={isAI ? "#151d22" : "#1d2925"}
                      borderRadius="7px"
                      px="3.5"
                      py="2.5"
                    >
                      <Text
                        color="#e2e7ea"
                        fontSize="sm"
                        lineHeight="1.62"
                        whiteSpace="pre-wrap"
                        overflowWrap="anywhere"
                        wordBreak="break-word"
                      >
                        {message.content}
                      </Text>
                    </Box>
                  </Box>
                  {!isAI && <MessageAvatar name={name} kind="human" />}
                </Flex>
              );
            })}
          </Stack>
        )}
      </Box>
    </Flex>
  );
}

export default ChatHistoryPanel;
