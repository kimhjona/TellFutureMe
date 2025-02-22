import { useState, useEffect } from "react";
import { VoiceRecorder } from "@/components/voice-recorder";
import { DatePicker } from "@/components/date-picker";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { z } from "zod";
import { MessageCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useSubmitVoiceNote } from "@/hooks/use-submit-voice-note";
import { Success } from "./success";

const emailSchema = z.string().email("Please enter a valid email address");

export default function Home() {
  const {
    email,
    setEmail,
    setAudioData,
    setDeliveryDate,
    handleSubmit,
    screenState,
    setScreenState,
    isPending,
  } = useSubmitVoiceNote();

  // Load email from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("userEmail");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Save email to localStorage when it changes
  useEffect(() => {
    if (email) {
      localStorage.setItem("userEmail", email);
    }
  }, [email]);

  const handleRecordAgain = () => {
    setAudioData(null);
    setDeliveryDate(null);
    setScreenState("recording");
  };

  if (screenState === "success") {
    return <Success handleRecordAgain={handleRecordAgain} email={email} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-muted/50 p-8">
      <div className="max-w-2xl mx-auto space-y-12">
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Voice Note to Future You
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Record a message today, receive it in the future. A time capsule for
            your thoughts and memories.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="border-2 border-muted shadow-xl hover:shadow-2xl transition-all duration-300">
            <VoiceRecorder
              onRecordingComplete={(data) => {
                setAudioData(data);
              }}
            />
          </Card>

          <Card className="border-2 border-muted shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-3 text-xl">
                <MessageCircle className="w-6 h-6 text-primary" />
                Your Contact
              </CardTitle>
              <CardDescription className="text-base">
                Enter your email to receive your future voice note
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`text-lg py-6 transition-all duration-300 focus:ring-2 focus:ring-primary/20 ${
                  email && !emailSchema.safeParse(email).success
                    ? "border-destructive"
                    : ""
                }`}
              />
            </CardContent>
          </Card>

          <Card className="border-2 border-muted shadow-xl hover:shadow-2xl transition-all duration-300">
            <DatePicker
              onDateSelect={(date) =>
                setDeliveryDate(format(date, "yyyy-MM-dd"))
              }
            />
          </Card>

          <Button
            onClick={handleSubmit}
            className="w-full font-medium text-xl py-8 transition-all duration-300 hover:scale-[1.02] shadow-xl disabled:opacity-70"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Scheduling...
              </span>
            ) : (
              "Send to Future"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
