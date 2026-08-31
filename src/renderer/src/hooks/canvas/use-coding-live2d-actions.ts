import { useEffect, useRef } from "react";
import { useChatHistory } from "@/context/chat-history-context";
import { useLive2DConfig } from "@/context/live2d-config-context";
import { useLive2DExpression } from "@/hooks/canvas/use-live2d-expression";
import {
  detectLive2DReaction,
  expressionForReaction,
  Live2DReaction,
  playLive2DReaction,
} from "@/utils/live2d-actions";
import { Message } from "@/services/websocket-service";

function reactionForMessage(message: Message): Live2DReaction {
  if (message.type === "reasoning") return "focused";
  if (message.type === "agent_activity") {
    if (message.status === "error") return "error";
    if (message.status === "completed") return "success";
    return "focused";
  }
  return detectLive2DReaction(message.content);
}

function messagePhase(message: Message): string {
  if (message.type === "reasoning" || message.type === "agent_activity") {
    return message.status || "running";
  }
  return "text";
}

export function useCodingLive2DActions(): void {
  const { messages } = useChatHistory();
  const { modelInfo } = useLive2DConfig();
  const { setExpression } = useLive2DExpression();
  const handledPhases = useRef(new Map<string, string>());

  useEffect(() => {
    const latestHumanIndex = messages
      .map((message) => message.role === "human")
      .lastIndexOf(true);
    const activeTurn = messages.slice(Math.max(latestHumanIndex, 0));
    const hasCodingEvents = activeTurn.some(
      (message) => message.type === "reasoning" || message.type === "agent_activity",
    );
    if (!hasCodingEvents) return;

    const latest = activeTurn
      .filter(
        (message) => message.type === "reasoning" ||
          message.type === "agent_activity" ||
          (message.type === "text" && message.role === "ai"),
      )
      .sort(
        (left, right) => new Date(right.timestamp).getTime() -
          new Date(left.timestamp).getTime(),
      )[0];
    if (!latest) return;
    if (Date.now() - new Date(latest.timestamp).getTime() > 15_000) return;

    const phase = messagePhase(latest);
    if (handledPhases.current.get(latest.id) === phase) return;
    handledPhases.current.set(latest.id, phase);

    const adapter = (window as any).getLAppAdapter?.();
    if (!adapter) return;
    const reaction = reactionForMessage(latest);
    const expression = expressionForReaction(modelInfo, reaction);
    if (expression !== undefined) {
      setExpression(expression, adapter);
    }
    if (latest.status === "error") {
      playLive2DReaction(adapter, reaction);
    }
  }, [messages, modelInfo, setExpression]);
}
