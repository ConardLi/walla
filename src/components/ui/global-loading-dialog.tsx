"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useLoadingStore } from "@/stores/loading-store";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function GlobalLoadingDialog() {
  const { visible, title, description } = useLoadingStore();

  return (
    <Dialog open={visible}>
      <DialogContent
        className="sm:max-w-[360px] p-0 gap-0 border-0 bg-transparent shadow-none"
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </VisuallyHidden>
        <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-xl bg-card border shadow-lg">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium text-sm">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
