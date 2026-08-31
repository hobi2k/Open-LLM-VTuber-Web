import { ModelInfo } from "@/context/live2d-config-context";
import * as LAppDefine from "../../WebSDK/src/lappdefine";

export type Live2DReaction =
  | "focused"
  | "success"
  | "error"
  | "warning"
  | "neutral";

interface Live2DAdapter {
  getMotionGroups: () => string[];
  getMotionCount: (group: string) => number;
  startMotion: (group: string, index: number, priority: number) => unknown;
}

const expressionCandidates: Record<Live2DReaction, string[]> = {
  focused: ["neutral", "surprise"],
  success: ["joy", "smirk", "surprise", "neutral"],
  error: ["sadness", "fear", "anger", "neutral"],
  warning: ["surprise", "fear", "neutral"],
  neutral: ["neutral"],
};

const motionCandidates: Record<Live2DReaction, string[]> = {
  focused: [],
  success: ["Tap", "FlickUp", "Flick3", "Talk", ""],
  error: ["Flick3", "FlickUp", "Tap", "Talk", ""],
  warning: ["FlickUp", "Tap", "Flick3", "Talk", ""],
  neutral: ["Talk", "Tap", "FlickUp", ""],
};

const motionIndexes: Record<Live2DReaction, number> = {
  focused: 0,
  success: 3,
  error: 1,
  warning: 4,
  neutral: 0,
};

export function detectLive2DReaction(text: string): Live2DReaction {
  const normalized = text.toLowerCase();
  if (/\[(joy|smirk)\]/u.test(normalized)) return "success";
  if (/\[(sadness|fear|anger|disgust)\]/u.test(normalized)) return "error";
  if (/\[surprise\]/u.test(normalized)) return "warning";
  if (
    /(failed|failure|error|unable|cannot|could not|오류|실패|불가|못했|エラー|失敗|できません)/u.test(
      normalized,
    )
  ) {
    return "error";
  }
  if (/(warning|caution|주의|경고|注意|警告)/u.test(normalized)) {
    return "warning";
  }
  if (
    /(success|succeeded|fixed|completed|done|passed|완료|수정했|해결|성공|통과|完了|修正|成功)/u.test(
      normalized,
    )
  ) {
    return "success";
  }
  return "neutral";
}

export function expressionForReaction(
  modelInfo: ModelInfo | undefined,
  reaction: Live2DReaction,
): string | number | undefined {
  if (!modelInfo) return undefined;
  const entries = Object.entries(modelInfo.emotionMap || {});
  const matched = expressionCandidates[reaction]
    .map((candidate) => entries.find(([key]) => key.toLowerCase() === candidate))
    .find((entry) => entry !== undefined);
  return matched?.[1] ?? modelInfo.defaultEmotion;
}

export function playLive2DReaction(
  adapter: Live2DAdapter,
  reaction: Live2DReaction,
): void {
  const groups = adapter.getMotionGroups();
  const preferredGroup = motionCandidates[reaction].find((candidate) => groups.includes(candidate));
  const fallbackGroup = groups.find((group) => group.toLowerCase() !== "idle");
  const group = preferredGroup ?? fallbackGroup;
  if (group === undefined) return;
  const count = adapter.getMotionCount(group);
  if (!count) return;
  adapter.startMotion(
    group,
    motionIndexes[reaction] % count,
    LAppDefine.PriorityNormal,
  );
}
