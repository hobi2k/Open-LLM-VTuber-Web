/* eslint-disable import/no-extraneous-dependencies */
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HiCheckCircle,
  HiChatBubbleLeftRight,
  HiCommandLine,
  HiCpuChip,
  HiDocumentText,
  HiExclamationCircle,
  HiLockClosed,
  HiWrenchScrewdriver,
} from "react-icons/hi2";
import { useChatHistory } from "@/context/chat-history-context";
import { useConfig } from "@/context/character-config-context";
import { useWebSocket } from "@/context/websocket-context";
import { Message } from "@/services/websocket-service";
import {
  activityInput,
  activityOutput,
  activityTitle,
} from "@/utils/agent-activity";
import {
  hasPermissionAnswers,
  PermissionAnswers,
  permissionAnswerPayload,
  PermissionQuestionFields,
  permissionQuestions,
} from "@/components/shared/permission-question-fields";
import {
  claimPermissionSubmission,
  isPermissionSubmissionPending,
  releasePermissionSubmission,
} from "@/utils/permission-submission";

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
      <Text
        color="#aeb9c1"
        fontSize="xs"
        lineHeight="1.4"
        overflowWrap="anywhere"
      >
        {label}
      </Text>
      <Box ml="auto" flexShrink="0">
        {statusIcon}
      </Box>
    </Flex>
  );
}

function ActivityDetail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): JSX.Element {
  return (
    <Box pt="2.5" mt="2.5" borderTop="1px solid #2a353c" minW="0">
      {label && (
        <Text color="#70808b" fontSize="2xs" fontWeight="semibold" mb="1.5">
          {label}
        </Text>
      )}
      <Box
        maxH="180px"
        overflowY="auto"
        bg="#0b1114"
        border="1px solid #202b31"
        borderRadius="4px"
        px="2.5"
        py="2"
      >
        <Text
          color="#cbd4da"
          fontSize="xs"
          lineHeight="1.6"
          fontFamily={mono ? "mono" : "inherit"}
          whiteSpace="pre-wrap"
          overflowWrap="anywhere"
          wordBreak="break-word"
        >
          {value}
        </Text>
      </Box>
    </Box>
  );
}

function diffLineColor(line: string): string {
  if (line.startsWith("+") && !line.startsWith("+++")) return "#8dd9ad";
  if (line.startsWith("-") && !line.startsWith("---")) return "#ee9a9f";
  if (line.startsWith("@@")) return "#8ebce0";
  return "#aab5bd";
}

function DiffDetail({ value }: { value: string }): JSX.Element {
  const { t } = useTranslation();
  return (
    <Box pt="2.5" mt="2.5" borderTop="1px solid #2a353c" minW="0">
      <Text color="#70808b" fontSize="2xs" fontWeight="semibold" mb="1.5">
        {t("sidebar.activityDiff")}
      </Text>
      <Box fontFamily="mono" fontSize="2xs" lineHeight="1.65" minW="0">
        {value.split("\n").map((line, index) => (
          <Text
            // Diff lines can repeat, so their position is part of the identity.
            // eslint-disable-next-line react/no-array-index-key
            key={`${index}-${line}`}
            color={diffLineColor(line)}
            whiteSpace="pre-wrap"
            overflowWrap="anywhere"
            wordBreak="break-word"
          >
            {line || " "}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function ActivityMessage({ message }: { message: Message }): JSX.Element {
  const { t } = useTranslation();
  const kind = message.activity_kind || "tool";
  const labels = {
    command: t("sidebar.activityCommand"),
    file: t("sidebar.activityFile"),
    tool: t("sidebar.activityTool"),
  };
  const statusLabels = {
    running: t("sidebar.activityRunning"),
    completed: t("sidebar.activityCompleted"),
    error: t("sidebar.activityFailed"),
  };
  const icon = {
    command: HiCommandLine,
    file: HiDocumentText,
    tool: HiWrenchScrewdriver,
  }[kind];
  const accent = {
    running: "#6d9fbe",
    completed: "#55b987",
    error: "#d86b72",
  }[message.status || "running"];
  const input = activityInput(message.input);
  const output = activityOutput(message.output);
  const title = activityTitle(message.title, message.tool_name, message.input);
  const displayTitle = title !== message.command && title !== message.path ? title : '';

  return (
    <Box
      ml="10"
      mr="2"
      minW="0"
      border="1px solid #2a353c"
      borderLeft={`3px solid ${accent}`}
      borderRadius="6px"
      bg="#12191d"
      px="3"
      py="2.5"
    >
      <Flex align="flex-start" gap="2.5" minW="0">
        <Flex
          align="center"
          justify="center"
          width="7"
          height="7"
          bg="#1b252b"
          color="#a6bbc8"
          borderRadius="5px"
          flexShrink="0"
        >
          <Icon as={icon} boxSize="4" />
        </Flex>
        <Box minW="0" flex="1">
          <Flex align="center" gap="2" minW="0" wrap="wrap">
            <Text color="#7f929e" fontSize="2xs" fontWeight="semibold">
              {labels[kind]}
            </Text>
            <Flex align="center" gap="1.5" color={accent}>
              {message.status === "running" ? (
                <Spinner size="xs" />
              ) : (
                <Icon
                  as={
                    message.status === "error"
                      ? HiExclamationCircle
                      : HiCheckCircle
                  }
                  boxSize="3.5"
                />
              )}
              <Text fontSize="2xs" fontWeight="semibold">
                {statusLabels[message.status || "running"]}
              </Text>
            </Flex>
            <Text color="#596873" fontSize="2xs" ml="auto" flexShrink="0">
              {formatTime(message.timestamp)}
            </Text>
          </Flex>
          {displayTitle && (
            <Text
              color="#e0e6e9"
              fontSize="xs"
              fontWeight="semibold"
              lineHeight="1.5"
              mt="1"
              overflowWrap="anywhere"
            >
              {displayTitle}
            </Text>
          )}
          {message.path && (
            <Text
              color="#8fa2ae"
              fontFamily="mono"
              fontSize="2xs"
              mt="1"
              whiteSpace="pre-wrap"
              overflowWrap="anywhere"
            >
              {message.path}
            </Text>
          )}
        </Box>
      </Flex>
      {message.command && (
        <ActivityDetail
          label=""
          value={`$ ${message.command}`}
          mono
        />
      )}
      {input && !message.command && (
        <ActivityDetail
          label={t("sidebar.activityInput")}
          value={input}
          mono
        />
      )}
      {message.diff && <DiffDetail value={message.diff} />}
      {output && (
        <ActivityDetail
          label={t("sidebar.activityOutput")}
          value={output}
          mono
        />
      )}
    </Box>
  );
}

function PermissionMessage({ message }: { message: Message }): JSX.Element {
  const { t } = useTranslation();
  const { sendMessage, wsState } = useWebSocket();
  const [answer, setAnswer] = useState("");
  const [questionAnswers, setQuestionAnswers] = useState<PermissionAnswers>({});
  const [submitting, setSubmitting] = useState(
    isPermissionSubmissionPending(message.request_id),
  );
  const pending = message.status === "running";
  const isQuestion = message.tool_name === "user_input";
  const questions = permissionQuestions(message.permission_input);
  const details = activityInput(message.permission_input);
  const answerReady = questions.length
    ? hasPermissionAnswers(questions, questionAnswers)
    : Boolean(answer.trim());
  const answerPayload = questions.length
    ? permissionAnswerPayload(questionAnswers)
    : answer.trim();

  const respond = (decision: "once" | "always" | "reject"): void => {
    if (!claimPermissionSubmission(message.request_id)) return;
    setSubmitting(true);
    const sent = sendMessage({
      type: "permission-response",
      request_id: message.request_id,
      decision,
      message: isQuestion && decision !== "reject" ? answerPayload : "",
    });
    if (!sent) {
      releasePermissionSubmission(message.request_id);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (message.status === "running") return;
    releasePermissionSubmission(message.request_id);
    setSubmitting(false);
  }, [message.request_id, message.status]);

  useEffect(() => {
    if (wsState !== "CLOSED") return;
    releasePermissionSubmission(message.request_id);
    setSubmitting(false);
  }, [message.request_id, wsState]);

  return (
    <Box
      ml="10"
      mr="2"
      minW="0"
      border="1px solid #5b4930"
      borderLeft="3px solid #d4b36b"
      borderRadius="6px"
      bg="#1d1a14"
      px="3"
      py="3"
    >
      <Flex align="flex-start" gap="2.5" minW="0">
        <Icon as={HiLockClosed} color="#e1c27c" boxSize="4" mt="0.5" />
        <Box minW="0" flex="1">
          <Text color="#f1e3c4" fontSize="xs" fontWeight="semibold" overflowWrap="anywhere">
            {message.title || message.tool_name || t("sidebar.permissionRequest")}
          </Text>
          <Text color="#a89572" fontSize="2xs" mt="0.5">
            {[message.runtime || "runtime", message.tool_name || "tool"].join(" · ")}
          </Text>
        </Box>
      </Flex>
      {message.description && (
        <Text color="#c8b995" fontSize="xs" lineHeight="1.55" mt="2" whiteSpace="pre-wrap">
          {message.description}
        </Text>
      )}
      {details && !isQuestion && (
        <ActivityDetail label={t("sidebar.activityInput")} value={details} mono />
      )}
      {isQuestion && pending && questions.length > 0 && (
        <PermissionQuestionFields
          input={message.permission_input}
          answers={questionAnswers}
          onChange={setQuestionAnswers}
          placeholder={t("sidebar.permissionAnswer")}
        />
      )}
      {isQuestion && pending && questions.length === 0 && (
        <Input
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          placeholder={t("sidebar.permissionAnswer")}
          mt="2.5"
          size="sm"
          borderColor="#5b4930"
          bg="#11100d"
        />
      )}
      {pending ? (
        <Flex gap="2" mt="3" wrap="wrap">
          {(message.options || []).map((option) => (
            <Button
              key={option.id}
              size="xs"
              variant={option.id === "reject" ? "outline" : "solid"}
              bg={option.id === "reject" ? "transparent" : "#d7e7f8"}
              color={option.id === "reject" ? "#e6a1a6" : "#11181d"}
              borderColor={option.id === "reject" ? "#704247" : "#d7e7f8"}
              disabled={submitting
                || (isQuestion && option.id !== "reject" && !answerReady)}
              onClick={() => respond(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </Flex>
      ) : (
        <Text color={message.status === "error" ? "#ef8a90" : "#72d6a2"} fontSize="xs" mt="2.5">
          {message.decision === "reject"
            ? t("sidebar.permissionRejected")
            : t("sidebar.permissionApproved")}
        </Text>
      )}
    </Box>
  );
}

function ChatHistoryPanel(): JSX.Element {
  const { t } = useTranslation();
  const { messages } = useChatHistory();
  const { confName } = useConfig();
  const { baseUrl } = useWebSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const validMessages = useMemo(
    () => messages.filter(
      (message) => Boolean(message.content) ||
          message.type === "reasoning" ||
          message.type === "tool_call_status" ||
          message.type === "agent_activity" ||
          message.type === "permission",
    ),
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
          <Text
            color="#edf1f4"
            fontSize="sm"
            fontWeight="semibold"
            lineHeight="1.3"
          >
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
              if (message.type === "agent_activity") {
                return <ActivityMessage key={message.id} message={message} />;
              }
              if (message.type === "permission") {
                return <PermissionMessage key={message.id} message={message} />;
              }

              const isAI = message.role === "ai";
              const name = isAI
                ? message.name || confName || "AI"
                : t("sidebar.you");
              const avatar =
                isAI && message.avatar
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
                      <Text
                        color="#98a5ae"
                        fontSize="2xs"
                        fontWeight="semibold"
                      >
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
