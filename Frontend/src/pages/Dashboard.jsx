// Main dashboard: sidebar of lists + active list with tasks + share modal + alarms dialog.
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import {
  Plus,
  Share2,
  Trash2,
  LogOut,
  ListChecks,
  Sparkles,
  Pencil,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/firebase/authApi";
import {
  subscribeOwnedLists,
  subscribeSharedLists,
  subscribeTasks,
  createList,
  deleteList,
  updateListTitle,
  addTask,
  toggleTask,
  deleteTask,
  updateTaskText,
  updateTaskAlarm,
  updateListAlarm,
  resolvePermission,
} from "@/firebase/listsApi";
import { Spinner } from "@/components/Spinner";
import TaskItem from "@/components/TaskItem";
import ShareModal from "@/components/ShareModal";
import AlarmDialog from "@/components/AlarmDialog";
import { startAlarmChime, stopAlarmChime } from "@/firebase/AlarmChime";

const formatForInput = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ownedLists, setOwnedLists] = useState([]);
  const [sharedLists, setSharedLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const [newListTitle, setNewListTitle] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const [showListAlarmPicker, setShowListAlarmPicker] = useState(false);
  const [listAlarmDraft, setListAlarmDraft] = useState("");
  const [activeAlarm, setActiveAlarm] = useState(null);
  const firedAlarmsRef = useRef(new Set());

  const layoutRef = useRef(null);

  // Subscribe to owned + shared lists
  useEffect(() => {
    if (!user) return;
    const unsub1 = subscribeOwnedLists(user.uid, setOwnedLists);
    const idents = [user.uid, user.email].filter(Boolean);
    const unsub2 = subscribeSharedLists(idents, setSharedLists);
    return () => {
      unsub1();
      unsub2();
    };
  }, [user]);

  // Combined list (de-duped). Owned first.
  const allLists = useMemo(() => {
    const ownedIds = new Set(ownedLists.map((l) => l.id));
    const extras = sharedLists.filter((l) => !ownedIds.has(l.id));
    return [...ownedLists, ...extras];
  }, [ownedLists, sharedLists]);

  // Auto-select first list once available
  useEffect(() => {
    if (!activeListId && allLists.length > 0) {
      setActiveListId(allLists[0].id);
    }
    if (activeListId && !allLists.find((l) => l.id === activeListId)) {
      setActiveListId(allLists[0]?.id || null);
    }
  }, [allLists, activeListId]);

  // Subscribe to tasks of active list
  useEffect(() => {
    if (!activeListId) {
      setTasks([]);
      return;
    }
    setTasksLoading(true);
    const unsub = subscribeTasks(activeListId, (t) => {
      setTasks(t);
      setTasksLoading(false);
    });
    return unsub;
  }, [activeListId]);

  // Page load stagger
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("[data-anim='stagger']", {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      });
    }, layoutRef);
    return () => ctx.revert();
  }, []);

  const activeList = allLists.find((l) => l.id === activeListId);
  const perm = useMemo(() => resolvePermission(activeList, user), [activeList, user]);
  const canWrite = perm === "owner" || perm === "full" || perm === "write";
  const canDelete = perm === "owner" || perm === "full";
  const canShare = perm === "owner";

  // Monitor and trigger alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();

      // 1. Check active list alarm
      if (activeList && activeList.alarmTime) {
        const listAlarmDate = new Date(activeList.alarmTime);
        const alarmKey = `list-${activeList.id}-${activeList.alarmTime}`;
        if (listAlarmDate <= now && !firedAlarmsRef.current.has(alarmKey)) {
          firedAlarmsRef.current.add(alarmKey);
          setActiveAlarm({
            type: "list",
            id: activeList.id,
            listId: activeList.id,
            title: activeList.title,
          });
          startAlarmChime();
        }
      }

      // 2. Check active list tasks alarms
      tasks.forEach((t) => {
        if (!t.completed && t.alarmTime) {
          const taskAlarmDate = new Date(t.alarmTime);
          const alarmKey = `task-${t.id}-${t.alarmTime}`;
          if (taskAlarmDate <= now && !firedAlarmsRef.current.has(alarmKey)) {
            firedAlarmsRef.current.add(alarmKey);
            setActiveAlarm({
              type: "task",
              id: t.id,
              listId: activeList.id,
              text: t.text,
              listTitle: activeList.title,
            });
            startAlarmChime();
          }
        }
      });
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [activeList, tasks]);

  const handleDismissAlarm = async () => {
    if (!activeAlarm) return;
    const alarm = activeAlarm;
    try {
      if (alarm.type === "list") {
        await updateListAlarm(alarm.id, null);
      } else {
        await updateTaskAlarm(alarm.listId, alarm.id, null);
      }
      stopAlarmChime();
      setActiveAlarm(null);
      toast.success("Alarm dismissed");
    } catch (err) {
      toast.error("Failed to dismiss alarm: " + err.message);
    }
  };

  const handleSnoozeAlarm = async () => {
    if (!activeAlarm) return;
    const alarm = activeAlarm;
    // Snooze for 5 minutes
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    try {
      if (alarm.type === "list") {
        await updateListAlarm(alarm.id, snoozeTime);
      } else {
        await updateTaskAlarm(alarm.listId, alarm.id, snoozeTime);
      }
      stopAlarmChime();
      setActiveAlarm(null);
      toast.success("Alarm snoozed for 5 minutes");
    } catch (err) {
      toast.error("Failed to snooze alarm: " + err.message);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    const t = newListTitle.trim();
    if (!t) return;
    try {
      const id = await createList(t, user);
      setNewListTitle("");
      setActiveListId(id);
      toast.success("List created");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteList = async () => {
    if (!activeList || !canDelete) return;
    if (!window.confirm(`Delete list "${activeList.title}" and all its tasks?`)) return;
    try {
      await deleteList(activeList.id);
      toast.success("List deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!activeList || !canWrite) return;
    const text = newTaskText.trim();
    if (!text) return;
    try {
      await addTask(activeList.id, text);
      setNewTaskText("");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveTitle = async () => {
    const v = titleDraft.trim();
    if (v && v !== activeList.title) {
      await updateListTitle(activeList.id, v);
    }
    setEditingTitle(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      ref={layoutRef}
      data-testid="dashboard"
      className="h-screen flex flex-col md:flex-row bg-[#0B0B0B] text-white overflow-hidden"
    >
      {/* Sidebar */}
      <aside
        data-anim="stagger"
        className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/5 bg-[#0F0F0F] flex flex-col h-auto md:h-full max-h-[55vh] md:max-h-full"
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-[#DC143C] shadow-[0_0_10px_rgba(220,20,60,0.7)]" />
            <span className="text-xs uppercase tracking-[0.3em] text-[#8A8A8E]">
              NetNest
            </span>
          </div>
          <h2 className="font-headline text-2xl font-bold tracking-tight">Your lists</h2>
          <p className="text-xs text-[#555] mt-1 truncate">
            {user?.email || user?.phoneNumber || user?.uid}
          </p>
        </div>

        <form onSubmit={handleCreateList} className="p-4 border-b border-white/5 flex gap-2">
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="New list title…"
            data-testid="new-list-input"
            className="flex-1 bg-[#1A1A1A]/60 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-[#555] focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] outline-none"
          />
          <button
            type="submit"
            data-testid="create-list-btn"
            disabled={!newListTitle.trim()}
            className="px-3 bg-[#DC143C] hover:bg-[#ED1C45] disabled:opacity-40 rounded-lg transition-all hover:shadow-[0_0_14px_rgba(220,20,60,0.45)]"
            aria-label="Create list"
          >
            <Plus size={16} strokeWidth={2.2} />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto py-2">
          {allLists.length === 0 && (
            <p className="px-6 py-8 text-sm text-[#555] italic">
              No lists yet. Create your first one above.
            </p>
          )}
          {allLists.map((l) => {
            const isOwner = l.ownerId === user.uid;
            const isActive = l.id === activeListId;
            return (
              <button
                key={l.id}
                onClick={() => setActiveListId(l.id)}
                data-testid={`list-item-${l.id}`}
                className={`w-full text-left px-6 py-3 flex items-center justify-between gap-3 border-l-2 transition-all ${
                  isActive
                    ? "border-[#DC143C] bg-white/[0.03] text-white"
                    : "border-transparent text-[#8A8A8E] hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <ListChecks size={15} strokeWidth={1.6} className="shrink-0" />
                  <span className="truncate text-sm font-medium">{l.title}</span>
                </span>
                {!isOwner && (
                  <span className="text-[10px] uppercase tracking-widest text-[#DC143C] shrink-0">
                    shared
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleLogout}
          data-testid="logout-btn"
          className="m-4 px-4 py-2.5 text-sm border border-white/10 rounded-lg text-[#8A8A8E] hover:text-white hover:border-white/30 transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Sign out
        </button>
        <div className="text-center text-[10px] text-[#555] pb-4">
          &copy; {new Date().getFullYear()} NetNest. All rights reserved.
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {!activeList ? (
          <div data-anim="stagger" className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Sparkles size={48} className="text-[#DC143C] mb-4" strokeWidth={1.4} />
            <h2 className="font-headline text-3xl font-bold tracking-tight mb-2">
              No list selected
            </h2>
            <p className="text-[#8A8A8E] max-w-sm">
              Create a list on the left to get started, or accept a shared one.
            </p>
          </div>
        ) : (
          <>
            <header
              data-anim="stagger"
              className="px-6 md:px-10 pt-8 pb-5 border-b border-white/5 flex items-start md:items-center justify-between gap-4 flex-wrap"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.3em] text-[#555] mb-1">
                  {perm === "owner" ? "Owner" : `Shared · ${perm}`}
                </p>
                {editingTitle && canWrite ? (
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    data-testid="list-title-input"
                    className="font-headline text-3xl md:text-4xl font-extrabold tracking-tighter bg-transparent border-b border-[#DC143C]/60 outline-none w-full max-w-xl"
                  />
                ) : (
                  <div>
                    <h1
                      className="font-headline text-3xl md:text-4xl font-extrabold tracking-tighter flex items-center gap-3 group"
                      data-testid="list-title"
                    >
                      {activeList.title}
                      {canWrite && (
                        <button
                          onClick={() => {
                            setTitleDraft(activeList.title);
                            setEditingTitle(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-white transition"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    </h1>
                    {activeList.alarmTime && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-[#DC143C]">
                        <Bell size={13} className="shrink-0 animate-pulse" />
                        <span className="font-semibold tracking-wide uppercase">
                          List Reminder: {new Date(activeList.alarmTime).toLocaleString([], {
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

                {/* Inline List Alarm Picker */}
                {showListAlarmPicker && canWrite && (
                  <div className="mt-3 p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center gap-3 w-fit animate-in fade-in duration-200">
                    <span className="text-xs text-[#8A8A8E] font-medium">Set List Reminder:</span>
                    <input
                      type="datetime-local"
                      value={listAlarmDraft}
                      onChange={(e) => setListAlarmDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (listAlarmDraft) {
                            const d = new Date(listAlarmDraft);
                            if (!isNaN(d.getTime())) {
                              updateListAlarm(activeList.id, d.toISOString());
                            } else {
                              toast.error("Please select a valid date and time.");
                            }
                          } else {
                            toast.error("Please select a date and time.");
                          }
                          setShowListAlarmPicker(false);
                        }
                        if (e.key === "Escape") {
                          setShowListAlarmPicker(false);
                        }
                      }}
                      className="bg-[#0B0B0B] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#DC143C]"
                    />
                    <button
                      onClick={async () => {
                        if (listAlarmDraft) {
                          const d = new Date(listAlarmDraft);
                          if (!isNaN(d.getTime())) {
                            await updateListAlarm(activeList.id, d.toISOString());
                          } else {
                            toast.error("Please select a valid date and time.");
                          }
                        } else {
                          toast.error("Please select a date and time.");
                        }
                        setShowListAlarmPicker(false);
                      }}
                      className="px-3 py-1.5 bg-[#DC143C] hover:bg-[#ED1C45] rounded-lg text-[10px] uppercase tracking-wider font-bold text-white transition-all shadow-[0_0_8px_rgba(220,20,60,0.35)]"
                    >
                      Set
                    </button>
                    <button
                      onClick={() => setShowListAlarmPicker(false)}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] uppercase tracking-wider font-bold text-[#8A8A8E] hover:text-white"
                    >
                      Cancel
                    </button>
                    {activeList.alarmTime && (
                      <button
                        onClick={async () => {
                          await updateListAlarm(activeList.id, null);
                          setListAlarmDraft("");
                          setShowListAlarmPicker(false);
                        }}
                        className="px-2 py-1.5 bg-transparent border border-[#DC143C]/20 hover:border-[#DC143C]/50 text-[#DC143C] rounded-lg text-[10px] uppercase tracking-wider font-bold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {canWrite && (
                  <button
                    onClick={() => {
                      setListAlarmDraft(activeList.alarmTime ? formatForInput(activeList.alarmTime) : "");
                      setShowListAlarmPicker(!showListAlarmPicker);
                    }}
                    data-testid="list-alarm-btn"
                    className={`px-4 py-2 border rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                      activeList.alarmTime
                        ? "bg-[#DC143C]/10 border-[#DC143C]/40 text-[#DC143C] hover:bg-[#DC143C]/20"
                        : "bg-white/[0.04] hover:bg-white/[0.08] border-white/10 hover:border-white/20 text-[#8A8A8E] hover:text-white"
                    }`}
                  >
                    <Bell size={15} /> Reminder
                  </button>
                )}
                {canShare && (
                  <button
                    onClick={() => setShareOpen(true)}
                    data-testid="open-share-btn"
                    className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all"
                  >
                    <Share2 size={15} /> Share
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDeleteList}
                    data-testid="delete-list-btn"
                    className="px-3 py-2 bg-transparent hover:bg-[#DC143C]/10 border border-white/10 hover:border-[#DC143C]/50 rounded-lg text-sm text-[#8A8A8E] hover:text-[#DC143C] flex items-center gap-2 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </header>

            {/* Add task */}
            {canWrite && (
              <form
                onSubmit={handleAddTask}
                data-anim="stagger"
                className="px-6 md:px-10 pt-6 pb-2 flex gap-3"
              >
                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Add a new task…"
                  data-testid="new-task-input"
                  className="flex-1 bg-[#1A1A1A]/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#555] focus:border-[#DC143C] focus:ring-1 focus:ring-[#DC143C] outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={!newTaskText.trim()}
                  data-testid="add-task-btn"
                  className="px-5 bg-[#DC143C] hover:bg-[#ED1C45] disabled:opacity-40 rounded-lg font-semibold transition-all hover:shadow-[0_0_18px_rgba(220,20,60,0.45)] flex items-center gap-2"
                >
                  <Plus size={16} /> Add
                </button>
              </form>
            )}

            {/* Tasks */}
            <div
              data-anim="stagger"
              className="flex-1 overflow-y-auto px-2 md:px-6 py-4"
              data-testid="task-list"
            >
              {tasksLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Spinner />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-16 text-[#555]">
                  <p className="text-sm">
                    {canWrite
                      ? "No tasks yet — add your first one above."
                      : "This list is empty."}
                  </p>
                </div>
              ) : (
                tasks.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    onToggle={(v) => toggleTask(activeList.id, t.id, v)}
                    onDelete={() => deleteTask(activeList.id, t.id)}
                    onEditText={(v) => updateTaskText(activeList.id, t.id, v)}
                    onEditAlarm={(v) => updateTaskAlarm(activeList.id, t.id, v)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </main>

      {canShare && (
        <ShareModal open={shareOpen} onOpenChange={setShareOpen} list={activeList} />
      )}

      <AlarmDialog
        open={Boolean(activeAlarm)}
        onOpenChange={(open) => {
          if (!open) handleDismissAlarm();
        }}
        alarmData={activeAlarm}
        onDismiss={handleDismissAlarm}
        onSnooze={handleSnoozeAlarm}
      />
    </div>
  );
}

