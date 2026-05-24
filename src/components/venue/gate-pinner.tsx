import type { Gate } from "@/lib/types";

interface GatePinnerProps {
  gates: Gate[];
  className?: string;
}

export function GatePinner({ gates, className }: GatePinnerProps) {
  return (
    <div className={className}>
      {gates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No gates configured</p>
      ) : (
        <div className="grid gap-2">
          {gates.map((gate, i) => (
            <div
              key={gate.id}
              className="flex items-center gap-3 p-2 rounded-lg border bg-background"
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{gate.label}</p>
                <p className="text-xs text-muted-foreground">Zone: {gate.zone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
