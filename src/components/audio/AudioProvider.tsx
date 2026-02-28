"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AudioContextType {
  isPlaying: boolean;
  toggle: () => void;
  analyserNode: AnalyserNode | null;
}

const AudioCtx = createContext<AudioContextType>({
  isPlaying: false,
  toggle: () => {},
  analyserNode: null,
});

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceCreated = useRef(false);

  const initAudio = useCallback(() => {
    if (ctxRef.current) return;

    const audio = new Audio("/bgm.mp3");
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    sourceCreated.current = true;

    setAnalyserNode(analyser);
  }, []);

  const toggle = useCallback(() => {
    initAudio();

    const audio = audioRef.current;
    const ctx = ctxRef.current;
    if (!audio || !ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [initAudio]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      ctxRef.current?.close();
    };
  }, []);

  return (
    <AudioCtx.Provider value={{ isPlaying, toggle, analyserNode }}>
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  return useContext(AudioCtx);
}
