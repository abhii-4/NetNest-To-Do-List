// Share modal: add collaborators by email/UID with 3 permission tiers.
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Eye, Pencil, ShieldCheck, X, UserPlus } from "lucide-react";
import { shareList, unshareList, updateSharePermission } from "@/firebase/listsApi";
import { toast } from "sonner";

const PERM_OPTIONS = [
  {
    value: "read",
    label: "View",
    description: "Read-only access",
    Icon: Eye,
  },
  {
    value: "write",
    label: "Edit",
    description: "Add & toggle tasks",
    Icon: Pencil,
  },
  {
    value: "full",
    label: "Full Access",
    description: "Add, update & delete",
    Icon: ShieldCheck,
  },
];

const PermBadge = ({ value, onChange, disabled }) => (
  <div className="flex items-center gap-1 bg-white/[0.04] rounded-full p-1">
    {PERM_OPTIONS.map(({ value: v, label, Icon }) => (
      <button
        key={v}
        disabled={disabled}
        onClick={() => onChange(v)}
        data-testid={`perm-${v}`}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-all
          ${value === v
            ? "bg-[#DC143C] text-white shadow-[0_0_12px_rgba(220,20,60,0.45)]"
            : "text-[#8A8A8E] hover:text-white"}`}
      >
        <Icon size={12} strokeWidth={2} />
        {label}
      </button>
    ))}
  </div>
);

export const ShareModal = ({ open, onOpenChange, list }) => {
  const [identifier, setIdentifier] = useState("");
  const [perm, setPerm] = useState("write");
  const [submitting, setSubmitting] = useState(false);

  if (!list) return null;

  const handleAdd = async (e) => {
    e?.preventDefault();
    const id = identifier.trim();
    if (!id) return;
    setSubmitting(true);
    try {
      await shareList(list.id, id, perm);
      toast.success(`Shared with ${id}`);
      setIdentifier("");
    } catch (err) {
      toast.error(err.message || "Failed to share");
    } finally {
      setSubmitting(false);
    }
  };

  const sharedEntries = (list.sharedWith || []).map((key) => ({
    key,
    perm: list.permissions?.[key] || "read",
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="share-modal"
        className="backdrop-blur-2xl bg-[#0B0B0B]/95 border border-white/10 shadow-2xl rounded-2xl text-white sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Share &ldquo;{list.title}&rdquo;
          </DialogTitle>
          <DialogDescription className="text-[#8A8A8E]">
            Invite collaborators by email or user ID. Choose a permission level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAdd} className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="email@example.com or user UID"
              data-testid="share-input"
              className="flex-1 bg-[#1A1A1A]/60 border border-white/10 rounded-lg p-3 placeholder-[#555] focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !identifier.trim()}
              data-testid="share-add-btn"
              className="px-4 py-3 bg-[#DC143C] hover:bg-[#ED1C45] disabled:opacity-50 rounded-lg font-semibold transition-all hover:shadow-[0_0_18px_rgba(220,20,60,0.45)]"
            >
              <UserPlus size={18} />
            </button>
          </div>

          <PermBadge value={perm} onChange={setPerm} />
        </form>

        <div className="pt-4 border-t border-white/5">
          <p className="text-xs uppercase tracking-[0.2em] text-[#555] mb-3">
            Collaborators ({sharedEntries.length})
          </p>
          {sharedEntries.length === 0 ? (
            <p className="text-sm text-[#555] italic">Not shared yet.</p>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {sharedEntries.map(({ key, perm: p }) => (
                <li
                  key={key}
                  data-testid={`collab-row-${key}`}
                  className="flex items-center justify-between gap-3 bg-white/[0.03] rounded-lg p-3"
                >
                  <span className="text-sm truncate flex-1">{key}</span>
                  <PermBadge
                    value={p}
                    onChange={(v) => updateSharePermission(list.id, key, v)}
                  />
                  <button
                    onClick={() => unshareList(list.id, key)}
                    data-testid={`collab-remove-${key}`}
                    className="p-1.5 text-[#8A8A8E] hover:text-[#DC143C] rounded"
                    aria-label="Remove collaborator"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
