import React from "react";
import { Bell, Clock, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AlarmDialog({ open, onOpenChange, alarmData, onDismiss, onSnooze }) {
  if (!alarmData) return null;

  const { type, title, text, listTitle } = alarmData;
  const isTask = type === "task";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="alarm-modal"
        className="backdrop-blur-3xl bg-[#0B0B0B]/95 border-2 border-[#DC143C]/60 shadow-[0_0_50px_rgba(220,20,60,0.35)] rounded-2xl text-white sm:max-w-md focus:outline-none"
      >
        <DialogHeader className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#DC143C]/10 border border-[#DC143C]/30 flex items-center justify-center mb-4 animate-pulse shadow-[0_0_20px_rgba(220,20,60,0.25)]">
            <Bell className="text-[#DC143C] w-8 h-8 animate-bounce" />
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white uppercase tracking-[0.1em]">
            Nest Alert
          </DialogTitle>
          <DialogDescription className="text-[#8A8A8E]">
            {isTask ? `Reminder for a task in "${listTitle}"` : "Reminder for this list"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 text-center">
          <p className="text-xl font-medium tracking-wide text-white bg-white/[0.03] border border-white/5 rounded-xl px-4 py-6 shadow-inner max-h-48 overflow-y-auto">
            &ldquo;{isTask ? text : title}&rdquo;
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onSnooze}
            data-testid="alarm-snooze-btn"
            className="flex-1 py-3.5 bg-transparent border border-white/20 hover:border-white/40 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:bg-white/5"
          >
            <Clock size={16} /> Snooze (5m)
          </button>
          <button
            onClick={onDismiss}
            data-testid="alarm-dismiss-btn"
            className="flex-1 py-3.5 bg-[#DC143C] hover:bg-[#ED1C45] rounded-xl font-semibold text-sm transition-all hover:shadow-[0_0_20px_rgba(220,20,60,0.4)] flex items-center justify-center gap-2"
          >
            <Check size={16} strokeWidth={2.5} /> Dismiss
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
