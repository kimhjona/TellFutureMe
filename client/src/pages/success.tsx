import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export function Success({
  email,
  handleRecordAgain,
}: {
  email: string;
  handleRecordAgain: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-muted/50 p-8 flex items-center justify-center">
      <Card className="max-w-md w-full border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="pt-8 px-8 text-center space-y-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Voice Note Scheduled!
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your message has been saved and will be delivered to your future
              self at the scheduled time. We'll send a confirmation to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </p>
          </div>
          <Button
            onClick={handleRecordAgain}
            className="w-full gap-2 py-6 text-lg font-medium hover:scale-[1.02] transition-all duration-300"
            size="lg"
          >
            Record Another Message
            <ArrowRight className="w-5 h-5" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
