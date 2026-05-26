import { FormEvent, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommitteeInputProps {
  onSubmit: (question: string) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  "Why is the market moving today?",
  "What's the macro setup right now?",
  "Risk-on or risk-off?",
  "Where is volatility heading?",
];

export function CommitteeInput({ onSubmit, loading }: CommitteeInputProps) {
  const [value, setValue] = useState("");

  function handle(e: FormEvent) {
    e.preventDefault();
    const v = value.trim();
    if (!v || loading) return;
    onSubmit(v);
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handle} className="relative">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask the committee…"
          disabled={loading}
          maxLength={500}
          className="w-full h-12 rounded-xl border border-border bg-card pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all"
        />
        <Button
          type="submit"
          size="icon"
          disabled={loading || !value.trim()}
          className="absolute right-1.5 top-1.5 h-9 w-9"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={loading}
            onClick={() => {
              setValue(s);
              onSubmit(s);
            }}
            className="rounded-full border border-border bg-card px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
