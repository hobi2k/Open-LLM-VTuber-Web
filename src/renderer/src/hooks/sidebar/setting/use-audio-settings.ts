import { useCallback, useEffect, useState } from "react";
import { useWebSocket } from "@/context/websocket-context";

interface AudioSettingsProps {
  onSave?: (callback: () => void) => () => void;
  onCancel?: (callback: () => void) => () => void;
}

export interface AudioSettings {
  tts: {
    enabled: boolean;
    loaded: boolean;
    engine: string;
    available_engines: string[];
    engines: Record<string, {
      voice: string | null;
      voice_field: string | null;
      model: string | null;
    }>;
    voice: string | null;
    voice_field: string | null;
    model: string | null;
  };
  asr: {
    enabled: boolean;
    loaded: boolean;
    engine: string;
    model: string;
    model_type: string | null;
    device: string | null;
  };
}

const emptySettings: AudioSettings = {
  tts: {
    enabled: true,
    loaded: false,
    engine: "",
    available_engines: [],
    engines: {},
    voice: null,
    voice_field: null,
    model: null,
  },
  asr: {
    enabled: true,
    loaded: false,
    engine: "",
    model: "",
    model_type: null,
    device: null,
  },
};

export function useAudioSettings({ onSave, onCancel }: AudioSettingsProps = {}) {
  const { baseUrl } = useWebSocket();
  const [settings, setSettings] = useState(emptySettings);
  const [originalSettings, setOriginalSettings] = useState(emptySettings);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const loadAudioSettings = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/audio/settings`);
      if (!response.ok) throw new Error(`Audio settings request failed (${response.status})`);
      const payload = (await response.json()) as AudioSettings;
      setSettings(payload);
      setOriginalSettings(payload);
      setState("ready");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
      setState("error");
    }
  }, [baseUrl]);

  useEffect(() => {
    loadAudioSettings();
  }, [loadAudioSettings]);

  const changeTTSEngine = useCallback((engine: string) => {
    setSettings((previous) => ({
      ...previous,
      tts: {
        ...previous.tts,
        engine,
        voice: previous.tts.engines[engine]?.voice ?? null,
        voice_field: previous.tts.engines[engine]?.voice_field ?? null,
        model: previous.tts.engines[engine]?.model ?? null,
      },
    }));
  }, []);

  const changeTTSVoice = useCallback((voice: string) => {
    setSettings((previous) => ({
      ...previous,
      tts: { ...previous.tts, voice },
    }));
  }, []);

  const changeASREnabled = useCallback((enabled: boolean) => {
    setSettings((previous) => ({
      ...previous,
      asr: { ...previous.asr, enabled },
    }));
  }, []);

  const changeTTSEnabled = useCallback((enabled: boolean) => {
    setSettings((previous) => ({
      ...previous,
      tts: { ...previous.tts, enabled },
    }));
  }, []);

  const saveAudioSettings = useCallback(async () => {
    if (!settings.tts.engine) return;
    setState("saving");
    setError(null);
    try {
      const response = await fetch(`${baseUrl}/api/audio/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: settings.tts.engine,
          voice: settings.tts.voice,
          asr_enabled: settings.asr.enabled,
          tts_enabled: settings.tts.enabled,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
        throw new Error(payload?.detail || `Audio settings update failed (${response.status})`);
      }
      const payload = (await response.json()) as AudioSettings;
      setSettings(payload);
      setOriginalSettings(payload);
      setState("ready");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
      setState("error");
      throw saveError;
    }
  }, [
    baseUrl,
    settings.asr.enabled,
    settings.tts.enabled,
    settings.tts.engine,
    settings.tts.voice,
  ]);

  const cancelAudioSettings = useCallback(() => {
    setSettings(originalSettings);
  }, [originalSettings]);

  useEffect(() => {
    if (!onSave || !onCancel) return;
    const cleanupSave = onSave(saveAudioSettings);
    const cleanupCancel = onCancel(cancelAudioSettings);
    return () => {
      cleanupSave?.();
      cleanupCancel?.();
    };
  }, [onSave, onCancel, saveAudioSettings, cancelAudioSettings]);

  return {
    settings,
    state,
    error,
    loadAudioSettings,
    changeTTSEngine,
    changeTTSVoice,
    changeASREnabled,
    changeTTSEnabled,
    saveAudioSettings,
  };
}

export type AudioSettingsController = ReturnType<typeof useAudioSettings>;
