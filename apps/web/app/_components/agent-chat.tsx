"use client";

import { ClientError, type MessagePart } from "eve/client";
import {
  activeTurn,
  activity,
  failure,
  interaction,
  interactions,
  turns,
  type Activity,
} from "eve/events";
import { useEveAgent } from "eve/react";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BrainIcon,
  BriefcaseBusinessIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronLeftIcon,
  Clock3Icon,
  CoffeeIcon,
  FlameIcon,
  HeadphonesIcon,
  MicIcon,
  MicOffIcon,
  MoonStarIcon,
  PlusIcon,
  RotateCcwIcon,
  SparklesIcon,
  SquareIcon,
  SunIcon,
  TargetIcon,
  Volume2Icon,
  VolumeXIcon,
  WavesIcon,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationTopFade,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { Trace, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace";
import { cn } from "@/lib/utils";
import { AgentMessage } from "./agent-message";
import { WEB_CHAT_AGENT } from "@/app/eve-agent";

const PROFILE_KEY = "fluency-profile-v1";
const PROGRESS_KEY = "fluency-progress-v1";
const SESSION_SECONDS = 180;

type Level = "starter" | "elementary" | "conversational" | "confident";
type VoiceMode = "always" | "manual";
type ListeningPurpose = "assessment" | "chat";

type LearnerProfile = {
  readonly level: Level;
  readonly voiceMode: VoiceMode;
  readonly startingSample?: string;
};

type LearnerProgress = {
  readonly completedDates: readonly string[];
  readonly correctionHistory: ReadonlyArray<{
    readonly date: string;
    readonly improved: string;
    readonly original: string;
  }>;
  readonly corrections: number;
  readonly lastPracticeDate?: string;
  readonly streak: number;
  readonly totalMinutes: number;
  readonly totalSessions: number;
};

const EMPTY_PROGRESS: LearnerProgress = {
  completedDates: [],
  correctionHistory: [],
  corrections: 0,
  streak: 0,
  totalMinutes: 0,
  totalSessions: 0,
};

const LEVELS: ReadonlyArray<{
  readonly id: Level;
  readonly label: string;
  readonly note: string;
}> = [
  { id: "starter", label: "Estou começando", note: "Sei palavras e frases bem curtas." },
  { id: "elementary", label: "Entendo o dia a dia", note: "Consigo responder perguntas simples." },
  {
    id: "conversational",
    label: "Já sustento uma conversa",
    note: "Falo sobre rotina, trabalho e planos.",
  },
  {
    id: "confident",
    label: "Quero ganhar naturalidade",
    note: "Já converso e quero soar mais espontâneo.",
  },
];

type SpeechRecognitionEventLike = {
  readonly resultIndex: number;
  readonly results: ArrayLike<{
    readonly isFinal: boolean;
    readonly 0: { readonly transcript: string };
  }>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: (() => void) | null;
  onerror: ((event: { readonly error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function AgentChat({
  sessionId,
}: {
  readonly sessionId?: string;
  readonly sessionless?: boolean;
}) {
  const [cancellationError, setCancellationError] = useState<string>();
  const [hasInputText, setHasInputText] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [assessmentTranscript, setAssessmentTranscript] = useState("");
  const [draftLevel, setDraftLevel] = useState<Level>("elementary");
  const [draftVoiceMode, setDraftVoiceMode] = useState<VoiceMode>("always");
  const [profile, setProfile] = useState<LearnerProfile>();
  const [progress, setProgress] = useState<LearnerProgress>(EMPTY_PROGRESS);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionWords, setSessionWords] = useState(0);
  const [voiceError, setVoiceError] = useState<string>();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hasSubmittedMessage = useRef(false);
  const listeningPurposeRef = useRef<ListeningPurpose>("chat");
  const recognitionRef = useRef<SpeechRecognitionLike | undefined>(undefined);
  const sessionStartedAtRef = useRef<number | undefined>(undefined);
  const spokenMessageRef = useRef<string | undefined>(undefined);
  const startListeningRef = useRef<() => void>(() => undefined);
  const autoListenRef = useRef(false);
  const voiceActivatedRef = useRef(false);

  const replaceSessionRoute = (nextSessionId: string) => {
    if (sessionId !== undefined) return;
    History.prototype.replaceState.call(
      window.history,
      window.history.state,
      "",
      "/s/" + encodeURIComponent(nextSessionId),
    );
  };

  const agent = useEveAgent({
    agent: WEB_CHAT_AGENT,
    prewarm: hasInputText,
    initialSession:
      sessionId === undefined
        ? undefined
        : {
            sessionId,
            streamIndex: 0,
          },
    resume: sessionId !== undefined,
    onSessionChange(session) {
      if (hasSubmittedMessage.current && session !== undefined) {
        replaceSessionRoute(session.sessionId);
      }
    },
  });

  const isBusy = agent.status === "busy";
  const turnOpen = activeTurn(agent.view) !== undefined;
  const isResuming = agent.status === "resuming";
  const isEmpty = agent.messages.length === 0;
  const lastMessage = agent.messages.at(-1);
  const isPendingAssistantShell =
    lastMessage?.role === "assistant" && lastMessage.parts.length === 0;
  const now = activity(agent.view);
  const showPendingThinking =
    isBusy &&
    now.kind !== "waiting-on-interaction" &&
    (lastMessage?.role !== "assistant" || isPendingAssistantShell);
  const failed =
    isBusy || isResuming ? undefined : failure(agent.view, turns(agent.view).at(-1)?.turnId);
  const turnFailure =
    failed?.code === "MODEL_CALL_FAILED"
      ? "A Mia está demorando para responder. Tente novamente."
      : failed?.message;
  const agentErrorMessage = agent.error?.message;
  const friendlyAgentError =
    agentErrorMessage?.includes("model connection is unavailable") === true ||
    agentErrorMessage?.includes("Run /login to reconnect") === true
      ? "Sua conexão com o ChatGPT precisa ser renovada. Faça login e tente novamente."
      : agentErrorMessage;
  const errorMessage = cancellationError ?? friendlyAgentError ?? turnFailure;
  const hasConversationContent = !isEmpty || errorMessage !== undefined;
  const showConversationLayout =
    hydrated && profile !== undefined && (isResuming || hasConversationContent);
  const activeSessionId = sessionId ?? agent.session?.sessionId;
  const sessionEnded =
    agent.error instanceof ClientError && agent.error.code === "session_not_active";
  const canRespond = (interactionId: string) =>
    !isResuming && !sessionEnded && interaction(agent.view, interactionId)?.status === "open";
  const questionsFor = (callId: string) =>
    interactions(agent.view).filter(
      (input) => input.request.kind === "question" && input.call?.callId === callId,
    );

  const correctionCount = useMemo(
    () =>
      agent.messages.reduce((total, message) => {
        if (message.role !== "assistant") return total;
        return (
          total +
          message.parts.reduce(
            (partTotal, item) =>
              item.type === "text"
                ? partTotal + (item.text.match(/Quick correction:/gi)?.length ?? 0)
                : partTotal,
            0,
          )
        );
      }, 0),
    [agent.messages],
  );

  const correctionEntries = useMemo(
    () =>
      agent.messages.flatMap((message) => {
        if (message.role !== "assistant") return [];
        return message.parts.flatMap((item) => {
          if (item.type !== "text") return [];
          const match = item.text.match(
            /Quick correction:\s*[“"](.+?)[”"]\s*→\s*[“"](.+?)[”"]/i,
          );
          return match === null
            ? []
            : [{ original: match[1] ?? "", improved: match[2] ?? "" }];
        });
      }),
    [agent.messages],
  );

  const latestAssistant = useMemo(() => {
    const message = [...agent.messages].reverse().find((item) => item.role === "assistant");
    if (message === undefined) return undefined;
    const text = message.parts
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join(" ")
      .trim();
    return text.length > 0 ? { id: message.id, text } : undefined;
  }, [agent.messages]);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(PROFILE_KEY);
      const savedProgress = localStorage.getItem(PROGRESS_KEY);
      if (savedProfile !== null) {
        const nextProfile = JSON.parse(savedProfile) as LearnerProfile;
        setProfile(nextProfile);
        setSoundEnabled(nextProfile.voiceMode === "always");
      }
      if (savedProgress !== null) {
        setProgress({ ...EMPTY_PROGRESS, ...(JSON.parse(savedProgress) as LearnerProgress) });
      }
    } catch {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(PROGRESS_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    autoListenRef.current =
      profile?.voiceMode === "always" && soundEnabled && !sessionComplete;
  }, [profile?.voiceMode, sessionComplete, soundEnabled]);

  useEffect(() => {
    if (
      !soundEnabled ||
      isBusy ||
      isResuming ||
      latestAssistant === undefined ||
      spokenMessageRef.current === latestAssistant.id
    ) {
      return;
    }
    spokenMessageRef.current = latestAssistant.id;
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      latestAssistant.text.replace(/Quick correction:[^\n]+/i, "").trim(),
    );
    utterance.lang = "en-US";
    utterance.rate = 0.94;
    utterance.pitch = 1.04;
    utterance.onend = () => {
      if (autoListenRef.current && voiceActivatedRef.current) {
        window.setTimeout(() => startListeningRef.current(), 350);
      }
    };
    window.speechSynthesis.speak(utterance);
  }, [isBusy, isResuming, latestAssistant, soundEnabled]);

  useEffect(() => {
    if (sessionStartedAtRef.current === undefined || sessionComplete) return;
    const updateElapsed = () => {
      const startedAt = sessionStartedAtRef.current;
      if (startedAt === undefined) return;
      setSessionElapsed(Math.floor((Date.now() - startedAt) / 1000));
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [sessionComplete, showConversationLayout]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const requestCancellation = () => {
    setCancellationError(undefined);
    void agent.cancel().catch((error: unknown) => {
      setCancellationError(toErrorMessage(error));
    });
  };

  const beginSessionIfNeeded = () => {
    if (sessionStartedAtRef.current === undefined) {
      sessionStartedAtRef.current = Date.now();
      setSessionElapsed(0);
    }
  };

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const text = message.text.trim();
      if ((text.length === 0 && message.files.length === 0) || isResuming) return;

      beginSessionIfNeeded();
      setSessionWords((value) => value + wordsIn(text));
      setHasInputText(false);
      setCancellationError(undefined);
      hasSubmittedMessage.current = true;
      if (agent.session !== undefined) replaceSessionRoute(agent.session.sessionId);
      const options = turnOpen ? { turnPolicy: "steer" as const } : undefined;

      if (message.files.length === 0) {
        await agent.send(text, options);
        return;
      }

      const parts: MessagePart[] = [];
      if (text.length > 0) {
        parts.push({ text, type: "text" });
      }
      for (const file of message.files) {
        parts.push({
          data: file.url,
          filename: file.filename,
          mediaType: file.mediaType,
          type: "file",
        });
      }
      await agent.send(parts, options);
    },
    [agent, isResuming, turnOpen],
  );

  const startListening = useCallback(
    (purpose: ListeningPurpose = "chat") => {
      setVoiceError(undefined);
      const browserWindow = window as typeof window & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
      const Recognition =
        browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
      if (Recognition === undefined) {
        setVoiceError("O reconhecimento de voz funciona melhor no Chrome ou Edge.");
        return;
      }

      if (isListening) {
        recognitionRef.current?.stop();
        return;
      }

      listeningPurposeRef.current = purpose;
      window.speechSynthesis?.cancel();
      const recognition = new Recognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let transcript = "";
        let isFinal = false;
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          transcript += event.results[index]?.[0].transcript ?? "";
          isFinal ||= event.results[index]?.isFinal ?? false;
        }
        const cleanTranscript = transcript.trim();
        setLiveTranscript(cleanTranscript);
        if (!isFinal || cleanTranscript.length === 0) return;

        recognition.stop();
        setLiveTranscript("");
        if (listeningPurposeRef.current === "assessment") {
          setAssessmentTranscript(cleanTranscript);
          return;
        }
        void handleSubmit({ files: [], text: cleanTranscript });
      };
      recognition.onerror = (event) => {
        if (event.error !== "aborted") {
          if (event.error === "not-allowed") voiceActivatedRef.current = false;
          setVoiceError(
            event.error === "not-allowed"
              ? "Libere o microfone no navegador e tente novamente."
              : "Não entendi esse áudio. Tente falar um pouco mais perto do microfone.",
          );
        }
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    },
    [handleSubmit, isListening],
  );

  useEffect(() => {
    startListeningRef.current = () => startListening("chat");
  }, [startListening]);

  const finishOnboarding = () => {
    const nextProfile: LearnerProfile = {
      level: draftLevel,
      voiceMode: draftVoiceMode,
      ...(assessmentTranscript ? { startingSample: assessmentTranscript } : {}),
    };
    setProfile(nextProfile);
    setSoundEnabled(nextProfile.voiceMode === "always");
    localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
  };

  const finalizeSession = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    const today = localDateKey();
    const lastDate = progress.lastPracticeDate;
    const streak =
      lastDate === today
        ? progress.streak
        : lastDate === offsetDateKey(-1)
          ? progress.streak + 1
          : 1;
    const minutes = Math.max(1, Math.round(Math.max(sessionElapsed, 30) / 60));
    const nextProgress: LearnerProgress = {
      completedDates: progress.completedDates.includes(today)
        ? progress.completedDates
        : [...progress.completedDates, today].slice(-28),
      corrections: progress.corrections + correctionCount,
      correctionHistory: [
        ...progress.correctionHistory,
        ...correctionEntries.map((entry) => ({ ...entry, date: today })),
      ].slice(-12),
      lastPracticeDate: today,
      streak,
      totalMinutes: progress.totalMinutes + minutes,
      totalSessions: progress.totalSessions + 1,
    };
    setProgress(nextProgress);
    setSessionComplete(true);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(nextProgress));
  };

  const resetProfile = () => {
    localStorage.removeItem(PROFILE_KEY);
    setProfile(undefined);
    setOnboardingStep(0);
    setAssessmentTranscript("");
    setSessionComplete(false);
  };

  const startTopic = (topic: string) => {
    void handleSubmit({
      files: [],
      text:
        "Hi Mia! Let's have a short conversation about " +
        topic +
        ". " +
        levelInstruction(profile?.level ?? "elementary"),
    });
  };

  if (!hydrated) {
    return <LoadingScreen />;
  }

  if (profile === undefined) {
    return (
      <Onboarding
        assessmentTranscript={assessmentTranscript}
        draftLevel={draftLevel}
        draftVoiceMode={draftVoiceMode}
        isListening={isListening}
        liveTranscript={liveTranscript}
        step={onboardingStep}
        voiceError={voiceError}
        onBack={() => setOnboardingStep((value) => Math.max(0, value - 1))}
        onFinish={finishOnboarding}
        onLevelChange={setDraftLevel}
        onListen={() => startListening("assessment")}
        onNext={() => setOnboardingStep((value) => Math.min(3, value + 1))}
        onVoiceModeChange={setDraftVoiceMode}
      />
    );
  }

  if (sessionComplete) {
    return (
      <SessionComplete
        corrections={correctionCount}
        elapsed={sessionElapsed}
        progress={progress}
        words={sessionWords}
        onNewSession={() => window.location.assign("/s")}
      />
    );
  }

  const composer = (
    <div className="space-y-2">
      {liveTranscript ? (
        <div className="mx-2 flex items-center gap-2 rounded-full bg-[#e6f7ef] px-3 py-2 text-[#145b3d] text-sm shadow-[0_8px_24px_rgba(20,91,61,0.08)]">
          <span className="size-2 animate-pulse rounded-full bg-[#27a96f]" />
          <span className="truncate">{liveTranscript}</span>
        </div>
      ) : null}
      {voiceError ? (
        <p aria-live="polite" className="px-3 text-[#95521b] text-sm" role="alert">
          {voiceError}
        </p>
      ) : null}
      <PromptInput
        className="border-0 bg-white shadow-[0_18px_48px_rgba(31,53,43,0.14)] ring-1 ring-[#dce7df]"
        onSubmit={handleSubmit}
      >
        <PromptInputTextarea
          className="min-h-14 pl-13 text-base"
          disabled={isResuming}
          onChange={(event) => setHasInputText(event.currentTarget.value.trim().length > 0)}
          placeholder="Fale em inglês ou digite…"
        />
        <PromptInputButton
          aria-label={isListening ? "Parar de ouvir" : "Começar a falar"}
          className={cn(
            "absolute bottom-2.5 left-2.5 size-9 rounded-full",
            isListening && "bg-[#ff6f4e] text-white hover:bg-[#e85f41]",
          )}
          onClick={() => {
            voiceActivatedRef.current = true;
            startListening("chat");
          }}
          type="button"
          variant={isListening ? "default" : "outline"}
        >
          {isListening ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
        </PromptInputButton>
        <ComposerAction
          canCancel={turnOpen}
          hasInputText={hasInputText}
          isResuming={isResuming}
          onCancel={requestCancellation}
        />
      </PromptInput>
      {profile.voiceMode === "always" ? (
        <p className="text-center text-[#607268] text-xs">
          Depois da resposta da Mia, o microfone abre novamente.
        </p>
      ) : null}
    </div>
  );

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-transparent text-foreground">
      {showConversationLayout ? (
        <ChatHeader
          canStartNewChat={activeSessionId !== undefined}
          elapsed={sessionElapsed}
          soundEnabled={soundEnabled}
          onFinish={finalizeSession}
          onToggleSound={() => {
            window.speechSynthesis?.cancel();
            setSoundEnabled((value) => !value);
          }}
        />
      ) : null}

      {showConversationLayout ? (
        <Conversation
          className="min-h-0 flex-1"
          initial={sessionId === undefined ? undefined : false}
          resize={activeSessionId === undefined ? "smooth" : "instant"}
          scrollRestorationKey={
            isEmpty || activeSessionId === undefined
              ? undefined
              : "eve:web-chat-scroll:" + activeSessionId
          }
        >
          <ConversationTopFade className="top-18" />
          <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 pt-24 pb-48 sm:px-6">
            <CoachArrival />
            {agent.messages.map((message) =>
              showPendingThinking &&
              isPendingAssistantShell &&
              message.id === lastMessage.id ? null : (
                <AgentMessage
                  canRespond={canRespond}
                  key={message.id}
                  message={message}
                  questionsFor={questionsFor}
                  view={agent.view}
                  onAnswers={async (answers) => {
                    setCancellationError(undefined);
                    await agent.respond(answers).catch((cause: unknown) => {
                      setCancellationError(
                        cause instanceof Error ? cause.message : "Não consegui enviar a resposta.",
                      );
                    });
                  }}
                />
              ),
            )}
            {showPendingThinking ? <PendingActivity activity={now} /> : null}
            {errorMessage ? <ErrorMessage message={errorMessage} /> : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      ) : null}

      <div
        className={cn(
          "mx-auto w-full px-4 sm:px-6",
          showConversationLayout
            ? "fixed bottom-0 left-1/2 z-20 max-w-3xl -translate-x-1/2 bg-gradient-to-t from-[#f5f7f1] via-[#f5f7f1] to-transparent pt-5 pb-5"
            : "flex max-w-6xl flex-1 items-center justify-center py-8",
        )}
      >
        {showConversationLayout ? null : (
          <DailyHome
            profile={profile}
            progress={progress}
            onResetProfile={resetProfile}
            onStartTopic={startTopic}
          />
        )}
        <div className={cn("w-full", !showConversationLayout && "hidden")}>{composer}</div>
      </div>
    </main>
  );
}

function Onboarding({
  assessmentTranscript,
  draftLevel,
  draftVoiceMode,
  isListening,
  liveTranscript,
  step,
  voiceError,
  onBack,
  onFinish,
  onLevelChange,
  onListen,
  onNext,
  onVoiceModeChange,
}: {
  readonly assessmentTranscript: string;
  readonly draftLevel: Level;
  readonly draftVoiceMode: VoiceMode;
  readonly isListening: boolean;
  readonly liveTranscript: string;
  readonly step: number;
  readonly voiceError?: string;
  readonly onBack: () => void;
  readonly onFinish: () => void;
  readonly onLevelChange: (level: Level) => void;
  readonly onListen: () => void;
  readonly onNext: () => void;
  readonly onVoiceModeChange: (mode: VoiceMode) => void;
}) {
  return (
    <main className="min-h-dvh bg-[#f5f7f1] px-5 py-6 text-[#18342a] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-5xl flex-col">
        <header className="flex items-center justify-between">
          <Brand />
          <span className="font-medium text-[#607268] text-sm">{step + 1} de 4</span>
        </header>
        <div
          aria-label="Progresso da configuração"
          aria-valuemax={4}
          aria-valuemin={1}
          aria-valuenow={step + 1}
          className="mt-5 h-1 overflow-hidden rounded-full bg-[#dfe8df]"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-[#ff6f4e] transition-[width] duration-500"
            style={{ width: ((step + 1) / 4) * 100 + "%" }}
          />
        </div>

        <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-10">
          {step === 0 ? (
            <div className="grid items-center gap-10 md:grid-cols-[1fr_0.8fr]">
              <div>
                <h1 className="max-w-2xl text-balance font-semibold text-5xl leading-[0.98] tracking-[-0.035em] sm:text-7xl">
                  Inglês destrava quando você usa.
                </h1>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#52675d]">
                  Conheça a Mia. Ela conversa, corrige o que importa e ajuda você a voltar
                  amanhã — três minutos de cada vez.
                </p>
                <Button
                  className="mt-8 h-12 rounded-full bg-[#18342a] px-6 text-base text-white hover:bg-[#264c3e]"
                  onClick={onNext}
                  size="lg"
                >
                  Preparar meu treino
                  <ArrowRightIcon />
                </Button>
              </div>
              <MiaPortrait size="large" />
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h1 className="text-balance font-semibold text-4xl tracking-[-0.03em] sm:text-5xl">
                Onde seu inglês está hoje?
              </h1>
              <p className="mt-3 text-[#607268]">
                Isso ajusta o vocabulário e o ritmo das perguntas. Você pode mudar depois.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {LEVELS.map((level) => (
                  <button
                    aria-pressed={draftLevel === level.id}
                    className={cn(
                      "group flex min-h-28 items-start gap-4 rounded-2xl bg-white p-5 text-left shadow-[0_12px_32px_rgba(31,53,43,0.07)] outline-none transition focus-visible:ring-3 focus-visible:ring-[#ff6f4e]/35",
                      draftLevel === level.id && "bg-[#18342a] text-white",
                    )}
                    key={level.id}
                    onClick={() => onLevelChange(level.id)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaf1e9] text-[#18342a]",
                        draftLevel === level.id && "bg-[#ffb69f]",
                      )}
                    >
                      {draftLevel === level.id ? <CheckIcon className="size-4" /> : null}
                    </span>
                    <span>
                      <span className="block font-semibold">{level.label}</span>
                      <span
                        className={cn(
                          "mt-1 block text-sm leading-relaxed text-[#607268]",
                          draftLevel === level.id && "text-[#c9d8cf]",
                        )}
                      >
                        {level.note}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <OnboardingActions onBack={onBack} onNext={onNext} />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="grid items-center gap-10 md:grid-cols-[1fr_0.8fr]">
              <div>
                <h1 className="text-balance font-semibold text-4xl tracking-[-0.03em] sm:text-5xl">
                  Como a Mia deve falar?
                </h1>
                <p className="mt-3 max-w-xl text-[#607268]">
                  A voz é gerada pelo seu navegador e não cria cobrança de API.
                </p>
                <div className="mt-8 space-y-3">
                  <VoiceChoice
                    active={draftVoiceMode === "always"}
                    description="Ela lê cada resposta e reabre o microfone no fim."
                    icon={<SunIcon />}
                    label="Conversa contínua"
                    onClick={() => onVoiceModeChange("always")}
                  />
                  <VoiceChoice
                    active={draftVoiceMode === "manual"}
                    description="Você escolhe quando ouvir e quando abrir o microfone."
                    icon={<MoonStarIcon />}
                    label="Controle manual"
                    onClick={() => onVoiceModeChange("manual")}
                  />
                </div>
                <OnboardingActions onBack={onBack} onNext={onNext} />
              </div>
              <div className="hidden justify-center md:flex">
                <MiaPortrait size="medium" />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="text-center">
              <h1 className="text-balance font-semibold text-4xl tracking-[-0.03em] sm:text-5xl">
                Uma frase para começar.
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-[#607268]">
                Diga em inglês como foi seu dia. Aqui verificamos conforto e transcrição — não
                inventamos uma nota de pronúncia que o navegador não consegue medir.
              </p>
              <button
                aria-label={isListening ? "Parar teste de voz" : "Começar teste de voz"}
                className={cn(
                  "mx-auto mt-9 flex size-28 items-center justify-center rounded-full bg-[#ff6f4e] text-white shadow-[0_18px_40px_rgba(255,111,78,0.28)] transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ff6f4e]/30",
                  isListening && "voice-ripple bg-[#18342a]",
                )}
                onClick={onListen}
                type="button"
              >
                {isListening ? <MicOffIcon className="size-10" /> : <MicIcon className="size-10" />}
              </button>
              <p className="mt-4 font-medium text-sm">
                {isListening ? "Estou ouvindo…" : "Toque e fale por alguns segundos"}
              </p>
              {liveTranscript || assessmentTranscript ? (
                <blockquote className="mx-auto mt-6 max-w-2xl rounded-2xl bg-white px-6 py-5 text-left text-lg shadow-[0_12px_32px_rgba(31,53,43,0.08)]">
                  “{liveTranscript || assessmentTranscript}”
                  {assessmentTranscript ? (
                    <span className="mt-3 block text-[#27805b] text-sm">
                      Voz captada: {wordsIn(assessmentTranscript)} palavras para seu ponto de partida.
                    </span>
                  ) : null}
                </blockquote>
              ) : null}
              {voiceError ? (
                <p aria-live="polite" className="mt-4 text-[#95521b] text-sm" role="alert">
                  {voiceError}
                </p>
              ) : null}
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={onBack} size="lg" variant="ghost">
                  <ChevronLeftIcon />
                  Voltar
                </Button>
                <Button
                  className="h-12 rounded-full bg-[#18342a] px-7 text-base text-white hover:bg-[#264c3e]"
                  onClick={onFinish}
                  size="lg"
                >
                  {assessmentTranscript ? "Começar meu treino" : "Pular por agora"}
                  <ArrowRightIcon />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function DailyHome({
  profile,
  progress,
  onResetProfile,
  onStartTopic,
}: {
  readonly profile: LearnerProfile;
  readonly progress: LearnerProgress;
  readonly onResetProfile: () => void;
  readonly onStartTopic: (topic: string) => void;
}) {
  const todayDone = progress.completedDates.includes(localDateKey());
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#18342a] px-6 py-8 text-white shadow-[0_28px_80px_rgba(24,52,42,0.22)] sm:px-10 sm:py-11">
        <div className="relative z-10 max-w-2xl">
          <Brand inverted />
          <h1 className="mt-12 max-w-2xl text-balance font-semibold text-5xl leading-[0.98] tracking-[-0.035em] sm:text-7xl">
            Três minutos. Uma conversa de verdade.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#c9d8cf]">
            A Mia acompanha seu nível, corrige sem cortar o assunto e deixa o próximo passo
            sempre fácil.
          </p>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            <TopicButton
              icon={<CoffeeIcon />}
              label="Meu dia"
              onClick={() => onStartTopic("how my day is going")}
            />
            <TopicButton
              icon={<BriefcaseBusinessIcon />}
              label="Trabalho"
              onClick={() => onStartTopic("work and my routine")}
            />
            <TopicButton
              icon={<SparklesIcon />}
              label="Surpresa"
              onClick={() => onStartTopic("a fun everyday surprise topic")}
            />
          </div>
        </div>
        <div className="absolute -right-8 -bottom-12 hidden opacity-95 sm:block">
          <MiaPortrait size="large" />
        </div>
      </section>

      <aside className="flex flex-col justify-between gap-6 py-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-xl tracking-[-0.02em]">Seu ritmo</h2>
            <button
              aria-label="Refazer configuração"
              className="rounded-full p-2 text-[#607268] transition hover:bg-white hover:text-[#18342a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6f4e]"
              onClick={onResetProfile}
              title="Refazer configuração"
              type="button"
            >
              <RotateCcwIcon className="size-4" />
            </button>
          </div>
          <dl className="mt-5 divide-y divide-[#dce5dc]">
            <Metric icon={<FlameIcon />} label="Sequência" value={progress.streak + " dias"} />
            <Metric
              icon={<Clock3Icon />}
              label="Tempo de treino"
              value={progress.totalMinutes + " min"}
            />
            <Metric
              icon={<TargetIcon />}
              label="Correções vistas"
              value={String(progress.corrections)}
            />
          </dl>
          {progress.correctionHistory.length > 0 ? (
            <div className="mt-6">
              <h3 className="font-semibold text-sm">Últimos ajustes</h3>
              <ul className="mt-3 space-y-3">
                {[...progress.correctionHistory]
                  .reverse()
                  .slice(0, 3)
                  .map((entry, index) => (
                    <li className="text-sm" key={entry.date + entry.original + index}>
                      <span className="block truncate text-[#7a8b82] line-through">
                        {entry.original}
                      </span>
                      <span className="mt-0.5 block truncate font-medium text-[#27805b]">
                        {entry.improved}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-[0_12px_32px_rgba(31,53,43,0.08)]">
          <div className="flex items-center gap-3">
            <CalendarDaysIcon className="size-5 text-[#27805b]" />
            <p className="font-semibold">{todayDone ? "Treino de hoje concluído" : "Hoje está livre"}</p>
          </div>
          <p className="mt-2 text-[#607268] text-sm leading-relaxed">
            {todayDone
              ? "Você já apareceu hoje. Voltar para mais uma conversa é bônus."
              : "Escolha um assunto e fale do jeito que conseguir. A constância vem antes da perfeição."}
          </p>
          <p className="mt-4 font-medium text-[#27805b] text-sm">
            Nível: {levelLabel(profile.level)}
          </p>
        </div>
      </aside>
    </div>
  );
}

function SessionComplete({
  corrections,
  elapsed,
  progress,
  words,
  onNewSession,
}: {
  readonly corrections: number;
  readonly elapsed: number;
  readonly progress: LearnerProgress;
  readonly words: number;
  readonly onNewSession: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#18342a] px-5 py-10 text-white">
      <div className="w-full max-w-4xl">
        <div className="grid items-center gap-10 md:grid-cols-[0.75fr_1fr]">
          <MiaPortrait size="large" />
          <div>
            <p className="font-medium text-[#ffb69f]">Treino concluído</p>
            <h1 className="mt-3 text-balance font-semibold text-5xl leading-none tracking-[-0.035em] sm:text-6xl">
              Você apareceu. É assim que destrava.
            </h1>
            <div className="mt-8 grid grid-cols-3 gap-5 border-y border-white/15 py-6">
              <SummaryMetric label="tempo" value={formatDuration(elapsed)} />
              <SummaryMetric label="palavras" value={String(words)} />
              <SummaryMetric label="correções" value={String(corrections)} />
            </div>
            <p className="mt-6 text-[#c9d8cf]">
              Sequência atual: {progress.streak} {progress.streak === 1 ? "dia" : "dias"}.
              Seu progresso ficou salvo neste navegador.
            </p>
            <Button
              className="mt-8 h-12 rounded-full bg-[#ff6f4e] px-7 text-base text-white hover:bg-[#f05d3d]"
              onClick={onNewSession}
              size="lg"
            >
              Nova conversa
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function CoachArrival() {
  return (
    <div className="mb-2 flex items-center gap-3 text-[#607268] text-sm">
      <MiaPortrait size="small" />
      <span>Mia entrou na conversa</span>
    </div>
  );
}

function MiaPortrait({ size }: { readonly size: "small" | "medium" | "large" }) {
  return (
    <div
      aria-label="Mia, sua professora de inglês"
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[38%_62%_46%_54%/48%_42%_58%_52%] bg-[#ffb69f]",
        size === "small" && "size-10 rounded-[42%_58%_50%_50%]",
        size === "medium" && "size-52",
        size === "large" && "size-64 sm:size-80",
      )}
      role="img"
    >
      <div className="absolute top-[16%] left-[19%] h-[53%] w-[62%] rounded-[45%_45%_42%_42%] bg-[#f5c8a9]" />
      <div className="absolute top-[5%] left-[14%] h-[39%] w-[72%] rounded-[48%_52%_38%_42%] bg-[#3c2d29]" />
      <div className="absolute top-[37%] left-[34%] size-[4%] rounded-full bg-[#18342a]" />
      <div className="absolute top-[37%] right-[34%] size-[4%] rounded-full bg-[#18342a]" />
      <div className="absolute top-[56%] left-[42%] h-0.5 w-[17%] rounded-full bg-[#a34c43]" />
      <div className="absolute right-[13%] bottom-[8%] left-[13%] h-[35%] rounded-t-[48%] bg-[#27805b]" />
      <HeadphonesIcon
        className={cn(
          "absolute top-[21%] left-[18%] text-[#f5f7f1]",
          size === "small" ? "size-7" : "size-[66%]",
        )}
        strokeWidth={size === "small" ? 1.7 : 1.2}
      />
    </div>
  );
}

function Brand({ inverted = false }: { readonly inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-[11px] bg-[#18342a] text-white",
          inverted && "bg-white text-[#18342a]",
        )}
      >
        <WavesIcon className="size-4" />
      </span>
      <span className={cn("font-semibold tracking-[-0.025em]", inverted && "text-white")}>
        Fluency
      </span>
    </div>
  );
}

function OnboardingActions({
  onBack,
  onNext,
}: {
  readonly onBack: () => void;
  readonly onNext: () => void;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <Button onClick={onBack} size="lg" variant="ghost">
        <ChevronLeftIcon />
        Voltar
      </Button>
      <Button
        className="h-11 rounded-full bg-[#18342a] px-6 text-white hover:bg-[#264c3e]"
        onClick={onNext}
        size="lg"
      >
        Continuar
        <ArrowRightIcon />
      </Button>
    </div>
  );
}

function VoiceChoice({
  active,
  description,
  icon,
  label,
  onClick,
}: {
  readonly active: boolean;
  readonly description: string;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-[0_12px_32px_rgba(31,53,43,0.07)] outline-none transition focus-visible:ring-3 focus-visible:ring-[#ff6f4e]/35",
        active && "bg-[#18342a] text-white",
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1e9] text-[#27805b] [&>svg]:size-5",
          active && "bg-[#ffb69f] text-[#18342a]",
        )}
      >
        {icon}
      </span>
      <span>
        <span className="font-semibold">{label}</span>
        <span className={cn("mt-1 block text-[#607268] text-sm", active && "text-[#c9d8cf]")}>
          {description}
        </span>
      </span>
    </button>
  );
}

function TopicButton({
  icon,
  label,
  onClick,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly onClick: () => void;
}) {
  return (
    <button
      className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/10 px-4 text-left font-medium text-white outline-none transition hover:-translate-y-0.5 hover:bg-white/16 focus-visible:ring-3 focus-visible:ring-[#ffb69f]/45"
      onClick={onClick}
      type="button"
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-[#ffb69f] text-[#18342a] [&>svg]:size-4">
        {icon}
      </span>
      {label}
    </button>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  readonly icon: ReactNode;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <span className="text-[#27805b] [&>svg]:size-5">{icon}</span>
      <dt className="flex-1 text-[#607268] text-sm">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function SummaryMetric({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="font-semibold text-2xl tabular-nums sm:text-3xl">{value}</p>
      <p className="mt-1 text-[#c9d8cf] text-sm">{label}</p>
    </div>
  );
}

function ChatHeader({
  canStartNewChat,
  elapsed,
  soundEnabled,
  onFinish,
  onToggleSound,
}: {
  readonly canStartNewChat: boolean;
  readonly elapsed: number;
  readonly soundEnabled: boolean;
  readonly onFinish: () => void;
  readonly onToggleSound: () => void;
}) {
  const progress = Math.min(100, (elapsed / SESSION_SECONDS) * 100);
  return (
    <header className="fixed top-0 right-0 left-0 z-20 bg-[#f5f7f1]/94 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
        <MiaPortrait size="small" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm">Mia</p>
              <p className="text-[#607268] text-xs">sua conversa de hoje</p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                aria-label={soundEnabled ? "Desativar voz" : "Ativar voz"}
                onClick={onToggleSound}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                {soundEnabled ? <Volume2Icon /> : <VolumeXIcon />}
              </Button>
              {canStartNewChat ? (
                <Button
                  aria-label="Nova conversa"
                  onClick={() => window.location.assign("/s")}
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <PlusIcon />
                </Button>
              ) : null}
              <Button
                className="rounded-full"
                onClick={onFinish}
                size="sm"
                type="button"
                variant="outline"
              >
                Concluir
              </Button>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div
              aria-label="Progresso do treino de três minutos"
              aria-valuemax={SESSION_SECONDS}
              aria-valuemin={0}
              aria-valuenow={Math.min(SESSION_SECONDS, elapsed)}
              className="h-1 flex-1 overflow-hidden rounded-full bg-[#dfe8df]"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-[#ff6f4e] transition-[width] duration-700"
                style={{ width: progress + "%" }}
              />
            </div>
            <span className="w-10 text-right text-[#607268] text-xs tabular-nums">
              {formatDuration(elapsed)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function ComposerAction({
  hasInputText,
  canCancel,
  isResuming,
  onCancel,
}: {
  readonly hasInputText: boolean;
  readonly canCancel: boolean;
  readonly isResuming: boolean;
  readonly onCancel: () => void;
}) {
  const attachments = usePromptInputAttachments();
  const canSubmit = hasInputText || attachments.files.length > 0;

  if (!canCancel || canSubmit) {
    return <PromptInputSubmit disabled={isResuming} />;
  }

  return (
    <PromptInputButton
      aria-label="Parar resposta"
      className="absolute right-2.5 bottom-2.5"
      onClick={onCancel}
      variant="outline"
    >
      <SquareIcon className="size-3 fill-current" />
    </PromptInputButton>
  );
}

function ErrorMessage({ message }: { readonly message: string }) {
  return (
    <Message className="max-w-full" from="assistant">
      <MessageContent>
        <div
          className="flex w-full items-start gap-3 rounded-2xl bg-[#fff0e9] px-4 py-3 text-sm text-[#7d351f]"
          role="alert"
        >
          <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">A conversa pausou</p>
            <p className="mt-0.5 opacity-80">{message}</p>
          </div>
        </div>
      </MessageContent>
    </Message>
  );
}

function PendingActivity({ activity }: { readonly activity: Activity }) {
  return (
    <Message aria-live="polite" from="assistant">
      <MessageContent>
        <Trace>
          <TraceLine status="running">
            <TraceIcon>
              <BrainIcon />
            </TraceIcon>
            <TraceTitle>{activityLabel(activity)}</TraceTitle>
          </TraceLine>
        </Trace>
      </MessageContent>
    </Message>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#f5f7f1] text-[#18342a]">
      <div className="flex items-center gap-3">
        <WavesIcon className="size-5 animate-pulse text-[#ff6f4e]" />
        <span className="font-medium">Preparando seu treino…</span>
      </div>
    </main>
  );
}

function activityLabel(activity: Activity): string {
  switch (activity.kind) {
    case "calling":
      return activity.names.join(", ");
    case "waiting-on-tasks":
      return "Organizando a conversa";
    case "compacting":
      return "Guardando o contexto";
    default:
      return "Mia está pensando";
  }
}

function wordsIn(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes + ":" + String(remaining).padStart(2, "0");
}

function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function offsetDateKey(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
}

function levelLabel(level: Level): string {
  return LEVELS.find((item) => item.id === level)?.label ?? level;
}

function levelInstruction(level: Level): string {
  switch (level) {
    case "starter":
      return "Please use very short and simple English.";
    case "elementary":
      return "Please use simple everyday English.";
    case "conversational":
      return "You can speak naturally and keep your turns short.";
    case "confident":
      return "Help me sound more natural and spontaneous.";
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não consegui interromper a resposta.";
}
