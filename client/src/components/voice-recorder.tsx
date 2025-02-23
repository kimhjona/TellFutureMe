import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, RotateCcw, Play, Pause } from "lucide-react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { WaveformVisualizer } from "./waveform-visualizer";

interface VoiceRecorderProps {
  onRecordingComplete: (audioData: Blob | null) => void;
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= 600) {
            if (mediaRecorder.current) {
              mediaRecorder.current.stop();
              setIsRecording(false);
            }
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 600;
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const updateProgress = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setPlaybackProgress((audio.currentTime / audio.duration) * 100);
        }
      };
      const handlePlaybackEnd = () => {
        setIsPlaying(false);
        setPlaybackProgress(0);
      };

      audio.addEventListener("timeupdate", updateProgress);
      audio.addEventListener("ended", handlePlaybackEnd);
      audio.addEventListener("pause", handlePause);
      audio.addEventListener("play", handlePlay);

      return () => {
        audio.removeEventListener("timeupdate", updateProgress);
        audio.removeEventListener("ended", handlePlaybackEnd);
        audio.removeEventListener("pause", handlePause);
        audio.removeEventListener("play", handlePlay);
      };
    }
  }, [audioURL]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono audio
          sampleRate: 16000, // 16 kHz is good for voice
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      console.log(
        "Got media stream:",
        stream.getAudioTracks().length,
        "audio tracks"
      );
      setAudioStream(stream);

      const options = {
        mimeType: getMimeType(),
        audioBitsPerSecond: 32000, // 32 kbps
      };

      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];
      setRecordingTime(0);

      mediaRecorder.current.ondataavailable = (event) => {
        console.log(
          "Received audio chunk of size:",
          event.data.size / 1024,
          "KB"
        );
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunks.current, {
            type: "audio/webm",
          });
          console.log(
            "Created audio blob of size:",
            audioBlob.size / 1024,
            "KB"
          );

          const url = URL.createObjectURL(audioBlob);
          setAudioURL(url);

          onRecordingComplete(audioBlob);
        } catch (error) {
          console.error("Error processing audio:", error);
          toast({
            title: "Error",
            description: "Failed to process audio. Please try recording again.",
            variant: "destructive",
          });
          onRecordingComplete(null);
        }

        stream.getTracks().forEach((track) => track.stop());
        setAudioStream(null);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Error",
        description:
          "Failed to access microphone. Please ensure microphone permissions are granted.",
        variant: "destructive",
      });
      onRecordingComplete(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resetRecording = () => {
    setAudioURL(null);
    setRecordingTime(0);
    setPlaybackProgress(0);
    setIsPlaying(false);
    onRecordingComplete(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playRecording = () => {
    if (audioRef.current && audioURL) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Record Your Message</CardTitle>
        <CardDescription>
          Leave a voice note for your future self (max 10 minutes)
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[175px]">
        <div className="space-y-8">
          <div className="space-y-4 min-h-[185px] flex flex-col justify-between">
            <div className="relative w-full max-w-[300px] mx-auto mt-0 z-10">
              <Button
                onClick={
                  audioURL
                    ? playRecording
                    : isRecording
                    ? stopRecording
                    : startRecording
                }
                className="w-full h-[80px] rounded-md bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 hover:bg-primary/90 text-primary-foreground shadow-lg overflow-hidden border border-gray-700/50 group z-10"
              >
                <span className="absolute inset-0 flex items-center justify-start w-[75%] text-lg font-medium pl-8 border-r border-gray-700/50 transition-all duration-500">
                  {isRecording
                    ? "Recording in progress..."
                    : isPlaying
                    ? "Listening to recording..."
                    : audioURL
                    ? "Listen to recording"
                    : "Click to start recording"}
                </span>
                <div className="absolute inset-0 left-auto flex items-center justify-center w-[25%] right-0">
                  <div className="relative w-10 h-10">
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                        isRecording || audioURL
                          ? "opacity-0 rotate-90 scale-0"
                          : "opacity-100 rotate-0 scale-100 group-hover:scale-[2.5]"
                      }`}
                    >
                      <Mic className="w-10 h-10" />
                    </div>
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                        isRecording
                          ? "opacity-100 rotate-0 scale-100 group-hover:scale-[2.5]"
                          : "opacity-0 rotate-90 scale-0"
                      }`}
                    >
                      <Square className="w-8 h-8" />
                    </div>
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
                        audioURL && !isRecording
                          ? "opacity-100 rotate-0 scale-100 group-hover:scale-[2.5]"
                          : "opacity-0 rotate-90 scale-0"
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8" />
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            {isRecording && (
              <div className="inset-0 pointer-events-none flex items-center justify-center h-0 z-0">
                <div className="w-full max-w-[300px]">
                  <WaveformVisualizer
                    stream={audioStream}
                    isRecording={isRecording}
                  />
                </div>
              </div>
            )}

            {(isRecording || (audioURL && isPlaying)) && (
              <div className="w-full max-w-[300px] mx-auto z-10">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-red-500 animate-pulse">
                    {isRecording ? "Recording..." : "Playing..."}
                  </span>
                  <span className="font-medium">
                    {isRecording
                      ? `${formatTime(recordingTime)} / ${formatTime(600)}`
                      : `${Math.round(playbackProgress)}%`}
                  </span>
                </div>
                <Progress
                  value={
                    isRecording ? (recordingTime / 600) * 100 : playbackProgress
                  }
                  className="h-1"
                />
              </div>
            )}

            {audioURL && (
              <>
                <audio ref={audioRef} src={audioURL} />
                <div className="flex justify-center">
                  <Button
                    onClick={resetRecording}
                    variant="outline"
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Record Again
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </>
  );
}

const getMimeType = () => {
  const types = [
    "audio/webm;codecs=opus",
    "audio/mp3",
    "audio/ogg",
    "audio/wav",
    "audio/aac",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log(`Browser supports ${type}`);
      return type;
    }
  }

  // Fallback
  return undefined; // Let the browser choose its default
};
