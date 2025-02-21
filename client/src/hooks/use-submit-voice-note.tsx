import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase, supabaseBucketName } from "@/components/supabase";
import { format, isAfter, parseISO } from "date-fns";

const emailSchema = z.string().email("Please enter a valid email address");

function isBlob(data: any): data is Blob {
  return data instanceof Blob;
}

function getFileName(deliveryDate: string, email: string) {
  return `${deliveryDate}/${email}/${Date.now()}.webm`;
}

export function useSubmitVoiceNote() {
  const [email, setEmail] = useState("");
  const [audioData, setAudioData] = useState<Blob | null>(null);
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<"recording" | "success">(
    "recording"
  );
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      fileName: string;
      deliveryDate: string;
    }) => {
      try {
        const response = await fetch("/api/confirmation-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.details || error.error || "Failed to send email"
          );
        }

        return response.json();
      } catch (error) {
        throw new Error("Failed to send email");
      }
    },
    onSuccess: () => {
      setIsPending(false);
      setScreenState("success");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const uploadFile = async (
    file: Blob,
    {
      fileName,
      email,
      deliveryDate,
    }: { fileName: string; email: string; deliveryDate: string }
  ) => {
    const response = await fetch("/api/generate-signed-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName }),
    });

    console.log("Signed URL response:", response);

    const { token } = await response.json();

    const { data, error } = await supabase.storage
      .from(supabaseBucketName)
      .uploadToSignedUrl(fileName, token, file);

    if (error) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to upload voice note. Please try again.",
        variant: "destructive",
      });
    }

    console.log("File uploaded successfully:", data);
    sendEmailMutation.mutate({
      email,
      fileName,
      deliveryDate,
    });
  };

  const voiceNoteMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      deliveryDate: string;
      fileName: string;
    }) => {
      const response = await fetch("/api/voice-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details || error.error || "Failed to submit data"
        );
      }

      return response.json();
    },
    onSuccess: (_data, { fileName, email, deliveryDate }) => {
      if (!isBlob(audioData)) {
        console.error("No audio data available");
        return;
      }

      uploadFile(audioData, { fileName, email, deliveryDate });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description:
          error.message || "Failed to schedule voice note. Please try again.",
        variant: "destructive",
      });
    },
  });

  function isValidDeliveryDate(
    date: string | null | undefined
  ): date is string {
    return !!date;
  }

  const handleSubmit = async () => {
    setIsPending(true);
    const errors: string[] = [];

    if (!email) {
      errors.push("Please enter your email address");
    } else {
      try {
        emailSchema.parse(email);
      } catch (error) {
        errors.push("Please enter a valid email address");
      }
    }

    if (!isValidDeliveryDate(deliveryDate)) {
      errors.push("Please select when to receive your voice note");
      return;
    }

    if (!isDeliveryDateAfterToday(deliveryDate)) {
      errors.push("Please select a date in the future");
    }

    if (!audioData) {
      errors.push("Please record your voice note");
    }

    if (errors.length > 0) {
      toast({
        title: "Missing information",
        description: (
          <div className="mt-2 space-y-2">
            {errors.map((error, index) => (
              <p key={index} className="text-sm">
                • {error}
              </p>
            ))}
          </div>
        ),
        variant: "destructive",
      });
      setIsPending(false);
      return;
    }

    voiceNoteMutation.mutate({
      email,
      deliveryDate,
      fileName: getFileName(deliveryDate, email),
    });
  };

  return {
    email,
    setEmail,
    setAudioData,
    setDeliveryDate,
    handleSubmit,
    isPending,
    screenState,
    setScreenState,
  };
}

function isDeliveryDateAfterToday(deliveryDate: string): boolean {
  const today = format(new Date(), "yyyy-MM-dd");
  return isAfter(parseISO(deliveryDate), today);
}
