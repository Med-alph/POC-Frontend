import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, Search, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import supportTicketsApi from "@/api/supportTicketsApi";
import toast from "react-hot-toast";

function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "< 1m";
}

function statusBadge(status) {
  const map = {
    OPEN: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200",
    IN_PROGRESS: "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200",
    RESOLVED: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200",
  };
  return map[status] || "bg-gray-100 text-gray-800";
}

function priorityBadge(priority) {
  const map = {
    LOW: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    MEDIUM: "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200",
    HIGH: "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200",
  };
  return map[priority] || map.MEDIUM;
}

function canManageFaq(user) {
  if (!user) return false;
  const r = typeof user.role === "string" ? user.role.toLowerCase() : "";
  if (r === "superadmin") return true;
  return (
    user.role === "Admin" ||
    user.designation_group === "Admin" ||
    user.role === "HOSPITAL_ADMIN"
  );
}

export default function SupportHubDialog({ open, onOpenChange, user }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hospitalId = user?.hospital_id;
  const [faqSearch, setFaqSearch] = useState("");
  const [raiseForm, setRaiseForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
  });
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "General",
  });
  const [activeTab, setActiveTab] = useState("faqs");

  const faqQuery = useQuery({
    queryKey: ["support-faqs", hospitalId, faqSearch],
    queryFn: () =>
      supportTicketsApi.listFaqs({
        hospitalId,
        search: faqSearch.trim() || undefined,
      }),
    enabled: open && !!hospitalId,
  });

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", "mine"],
    queryFn: () => supportTicketsApi.listTickets(),
    enabled: open,
  });

  const createTicket = useMutation({
    mutationFn: () => supportTicketsApi.createTicket(raiseForm),
    onSuccess: () => {
      toast.success("Ticket submitted");
      setRaiseForm({ title: "", description: "", priority: "MEDIUM" });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
      setActiveTab("tickets");
    },
    onError: (e) => toast.error(e.message || "Failed"),
  });

  useEffect(() => {
    if (!open) setActiveTab("faqs");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const fn = () => {
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    };
    window.addEventListener("support:new-ticket", fn);
    return () => window.removeEventListener("support:new-ticket", fn);
  }, [open, qc]);

  const createFaq = useMutation({
    mutationFn: () => supportTicketsApi.createFaq(faqForm, hospitalId),
    onSuccess: () => {
      toast.success("FAQ added");
      setFaqForm({ question: "", answer: "", category: "General" });
      qc.invalidateQueries({ queryKey: ["support-faqs"] });
    },
    onError: (e) => toast.error(e.message || "Failed"),
  });

  const groupedFaqs = useMemo(() => {
    const list = faqQuery.data || [];
    const m = new Map();
    for (const f of list) {
      const c = f.category || "General";
      if (!m.has(c)) m.set(c, []);
      m.get(c).push(f);
    }
    return m;
  }, [faqQuery.data]);

  const openTicket = (id) => {
    onOpenChange(false);
    navigate(`/support/ticket/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            Support & queries
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="raise">Raise query</TabsTrigger>
            <TabsTrigger value="tickets">My tickets</TabsTrigger>
          </TabsList>

          <TabsContent value="faqs" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search FAQs…"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
              />
            </div>
            {faqQuery.isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {faqQuery.error && (
              <p className="text-sm text-red-600">{faqQuery.error.message}</p>
            )}
            {canManageFaq(user) && (
              <div className="rounded-lg border border-border p-4 space-y-3 bg-muted/30">
                <p className="text-sm font-medium">Add FAQ (admin)</p>
                <Input
                  placeholder="Category"
                  value={faqForm.category}
                  onChange={(e) =>
                    setFaqForm((s) => ({ ...s, category: e.target.value }))
                  }
                />
                <Input
                  placeholder="Question"
                  value={faqForm.question}
                  onChange={(e) =>
                    setFaqForm((s) => ({ ...s, question: e.target.value }))
                  }
                />
                <textarea
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Answer"
                  value={faqForm.answer}
                  onChange={(e) =>
                    setFaqForm((s) => ({ ...s, answer: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  disabled={createFaq.isPending}
                  onClick={() => createFaq.mutate()}
                >
                  {createFaq.isPending ? "Saving…" : "Save FAQ"}
                </button>
              </div>
            )}
            <div className="space-y-4">
              {[...groupedFaqs.entries()].map(([category, items]) => (
                <div key={category} className="rounded-lg border border-border">
                  <div className="bg-muted/50 px-4 py-2 text-sm font-semibold">
                    {category}
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((f) => (
                      <details key={f.id} className="group px-4 py-3">
                        <summary className="cursor-pointer font-medium list-none flex justify-between gap-2">
                          <span>{f.question}</span>
                          <span className="text-muted-foreground text-xs">▼</span>
                        </summary>
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {f.answer}
                        </p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
              {!faqQuery.isLoading && groupedFaqs.size === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No FAQs yet.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="raise" className="space-y-4 mt-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={raiseForm.title}
                onChange={(e) =>
                  setRaiseForm((s) => ({ ...s, title: e.target.value }))
                }
              />
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={raiseForm.description}
                onChange={(e) =>
                  setRaiseForm((s) => ({ ...s, description: e.target.value }))
                }
              />
              <label className="text-sm font-medium">Priority</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={raiseForm.priority}
                onChange={(e) =>
                  setRaiseForm((s) => ({ ...s, priority: e.target.value }))
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <button
                type="button"
                className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={createTicket.isPending}
                onClick={() => createTicket.mutate()}
              >
                {createTicket.isPending ? "Submitting…" : "Submit ticket"}
              </button>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-3 mt-4">
            {ticketsQuery.isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {(ticketsQuery.data || []).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openTicket(t.id)}
                className="w-full text-left rounded-lg border border-border p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${statusBadge(
                      t.status
                    )}`}
                  >
                    {t.status}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${priorityBadge(
                      t.priority
                    )}`}
                  >
                    {t.priority}
                  </span>
                  {t.unreadCount > 0 && (
                    <span className="text-xs font-medium text-blue-600">
                      {t.unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground mt-2 flex flex-wrap gap-3">
                  <span>
                    Response SLA: {formatDuration(t.sla?.responseTimeMs)}
                  </span>
                  <span>
                    Resolution SLA: {formatDuration(t.sla?.resolutionTimeMs)}
                  </span>
                </div>
              </button>
            ))}
            {!ticketsQuery.isLoading &&
              (!ticketsQuery.data || ticketsQuery.data.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tickets yet.
                </p>
              )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
