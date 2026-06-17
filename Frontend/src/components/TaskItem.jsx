// Single task row with cinematic completion strike-through (GSAP trace), delete collapse, and alarm setup.
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Check, Trash2, Pencil, X, Bell } from "lucide-react";
import { toast } from "sonner";

const formatForInput = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const TaskItem = ({ task, canWrite, canDelete, onToggle, onDelete, onEditText, onEditAlarm }) => {
  const rowRef = useRef(null);
  const strikeRef = useRef(null);
  const textRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [showAlarmPicker, setShowAlarmPicker] = useState(false);
  const [alarmDraft, setAlarmDraft] = useState(task.alarmTime ? formatForInput(task.alarmTime) : "");

  // Mount animation: slide-down + scale-in.
  useEffect(() => {
    if (!rowRef.current) return;
    gsap.fromTo(
      rowRef.current,
      { opacity: 0, y: -15, scale: 0.95, height: 0 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        height: "auto",
        duration: 0.5,
        ease: "back.out(1.2)",
      }
    );
  }, []);

  // Strike-through trace animation tied to completion state.
  useEffect(() => {
    if (!strikeRef.current || !textRef.current) return;
    if (task.completed) {
      gsap.to(strikeRef.current, { width: "100%", duration: 0.45, ease: "power2.inOut" });
      gsap.to(textRef.current, { color: "#555555", duration: 0.45 });
    } else {
      gsap.to(strikeRef.current, { width: "0%", duration: 0.35, ease: "power2.inOut" });
      gsap.to(textRef.current, { color: "#FFFFFF", duration: 0.35 });
    }
  }, [task.completed]);

  const handleDeleteClick = () => {
    if (!rowRef.current) {
      onDelete();
      return;
    }
    gsap.to(rowRef.current, {
      opacity: 0,
      scale: 0.9,
      x: 20,
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      duration: 0.4,
      ease: "power2.inOut",
      onComplete: onDelete,
    });
  };

  const saveEdit = () => {
    const v = draft.trim();
    if (v && v !== task.text) onEditText(v);
    setEditing(false);
  };

  return (
    <div
      ref={rowRef}
      data-testid={`task-row-${task.id}`}
      className="group flex items-start gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors overflow-hidden"
    >
      <button
        onClick={() => canWrite && onToggle(!task.completed)}
        disabled={!canWrite}
        data-testid={`task-checkbox-${task.id}`}
        className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-all mt-0.5
          ${task.completed ? "bg-[#DC143C] border-[#DC143C]" : "border-white/20 hover:border-[#DC143C]"}
          ${!canWrite ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        aria-label="Toggle complete"
      >
        {task.completed && <Check size={14} strokeWidth={3} className="text-white" />}
      </button>

      <div className="relative flex-1 min-w-0 flex flex-col gap-1">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") {
                setDraft(task.text);
                setEditing(false);
              }
            }}
            data-testid={`task-edit-input-${task.id}`}
            className="w-full bg-transparent border-b border-[#DC143C]/60 outline-none text-white py-0.5"
          />
        ) : (
          <div className="min-w-0">
            <p
              ref={textRef}
              className="relative inline-block max-w-full truncate text-[15px] tracking-wide align-middle"
            >
              {task.text}
              <span
                ref={strikeRef}
                className="pointer-events-none absolute left-0 top-1/2 h-[1.5px] bg-[#8A8A8E]"
                style={{ width: 0 }}
              />
            </p>
            {task.alarmTime && (
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#DC143C]">
                <Bell size={12} className="shrink-0 animate-pulse" />
                <span className="font-semibold tracking-wide">
                  {new Date(task.alarmTime).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Inline Alarm Picker */}
        {showAlarmPicker && canWrite && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-white/[0.03] border border-white/5 rounded-lg w-fit transition-all">
            <input
              type="datetime-local"
              value={alarmDraft}
              onChange={(e) => setAlarmDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (alarmDraft) {
                    const d = new Date(alarmDraft);
                    if (!isNaN(d.getTime())) {
                      onEditAlarm(d.toISOString());
                    } else {
                      toast.error("Please select a valid date and time.");
                    }
                  } else {
                    toast.error("Please select a date and time.");
                  }
                  setShowAlarmPicker(false);
                }
                if (e.key === "Escape") {
                  setShowAlarmPicker(false);
                }
              }}
              className="bg-[#0B0B0B] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C]"
            />
            <button
              type="button"
              onClick={() => {
                if (alarmDraft) {
                  const d = new Date(alarmDraft);
                  if (!isNaN(d.getTime())) {
                    onEditAlarm(d.toISOString());
                  } else {
                    toast.error("Please select a valid date and time.");
                  }
                } else {
                  toast.error("Please select a date and time.");
                }
                setShowAlarmPicker(false);
              }}
              className="px-3 py-1 bg-[#DC143C] hover:bg-[#ED1C45] rounded-md text-[10px] uppercase tracking-wider font-bold text-white transition-all shadow-[0_0_8px_rgba(220,20,60,0.35)]"
            >
              Set
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAlarmPicker(false);
              }}
              className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded-md text-[10px] uppercase tracking-wider font-bold text-[#8A8A8E] hover:text-white transition-all"
            >
              Cancel
            </button>
            {task.alarmTime && (
              <button
                type="button"
                onClick={() => {
                  onEditAlarm(null);
                  setAlarmDraft("");
                  setShowAlarmPicker(false);
                }}
                className="px-2 py-1 bg-transparent border border-[#DC143C]/20 hover:border-[#DC143C]/50 text-[#DC143C] rounded-md text-[10px] uppercase tracking-wider font-bold transition-all"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {canWrite && !editing && (
          <button
            onClick={() => {
              setAlarmDraft(task.alarmTime ? formatForInput(task.alarmTime) : "");
              setShowAlarmPicker(!showAlarmPicker);
            }}
            data-testid={`task-alarm-btn-${task.id}`}
            className={`p-2 rounded-md transition-colors hover:bg-white/5 ${
              task.alarmTime ? "text-[#DC143C]" : "text-[#8A8A8E] hover:text-white"
            }`}
            aria-label="Set alarm"
          >
            <Bell size={15} strokeWidth={1.6} />
          </button>
        )}
        {canWrite && !editing && (
          <button
            onClick={() => {
              setDraft(task.text);
              setEditing(true);
            }}
            data-testid={`task-edit-btn-${task.id}`}
            className="p-2 rounded-md text-[#8A8A8E] hover:text-white hover:bg-white/5"
            aria-label="Edit task"
          >
            <Pencil size={15} strokeWidth={1.6} />
          </button>
        )}
        {editing && (
          <button
            onClick={() => {
              setDraft(task.text);
              setEditing(false);
            }}
            className="p-2 rounded-md text-[#8A8A8E] hover:text-white hover:bg-white/5"
            aria-label="Cancel"
          >
            <X size={15} strokeWidth={1.6} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={handleDeleteClick}
            data-testid={`task-delete-btn-${task.id}`}
            className="p-2 rounded-md text-[#8A8A8E] hover:text-[#DC143C] hover:bg-[#DC143C]/10"
            aria-label="Delete task"
          >
            <Trash2 size={15} strokeWidth={1.6} />
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
