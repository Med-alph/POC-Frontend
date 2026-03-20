import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import supportTicketsApi from "@/api/supportTicketsApi";
import socketService from "@/services/socketService";
import toast from "react-hot-toast";

function senderLabel(role) {
  switch (role) {
    case "SUPERADMIN":
      return "SuperAdmin";
    case "ADMIN":
      return "Admin";
    case "DOCTOR":
      return "Doctor";
    default:
      return role || "User";
  }
}

function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "< 1m";
}

export default function TicketChatPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const qc = useQueryClient();
  const bottomRef = useRef(null);
  const [text, setText] = useState("");
  const [typingName, setTypingName] = useState(null);
  const typingTimer = useRef(null);

  const socketRole =
    typeof user?.role === "string" && user.role.toLowerCase() === "superadmin"
      ? "superadmin"
      : user?.role === "Admin" ||
          user?.designation_group === "Admin" ||
          user?.role === "HOSPITAL_ADMIN"
        ? "admin"
        : "";

  useEffect(() => {
    if (!user?.id) return;
    socketService.connectNotifications(user.id, null, {
      hospitalId: user.hospital_id || undefined,
      role: socketRole,
      tenantId: user.tenant_id,
    });
  }, [user?.id, user?.hospital_id, user?.tenant_id, socketRole]);

  const detailQuery = useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: () => supportTicketsApi.getTicket(ticketId),
    enabled: !!ticketId,
  });

  const sendMutation = useMutation({
    mutationFn: (message) =>
      supportTicketsApi.sendMessage(ticketId, { message }),
    onMutate: async (message) => {
      await qc.cancelQueries({ queryKey: ["support-ticket", ticketId] });
      const prev = qc.getQueryData(["support-ticket", ticketId]);
      const roleFromUser =
        typeof user?.role === "string" && user.role.toLowerCase() === "superadmin"
          ? "SUPERADMIN"
          : user?.designation_group?.toLowerCase() === "doctor"
            ? "DOCTOR"
            : "ADMIN";
      const optimistic = {
        id: `temp-${Date.now()}`,
        ticketId,
        sender: { userId: user?.id, role: roleFromUser },
        message,
        attachments: [],
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData(["support-ticket", ticketId], (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...(old.messages || []), optimistic],
        };
      });
      return { prev };
    },
    onError: (err, _msg, ctx) => {
      if (ctx?.prev) qc.setQueryData(["support-ticket", ticketId], ctx.prev);
      toast.error(err.message || "Send failed");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detailQuery.data?.messages?.length]);

  useEffect(() => {
    if (!ticketId) return;
    supportTicketsApi.markRead(ticketId).catch(() => {});
  }, [ticketId]);

  const handleSocketMessage = useCallback(
    (payload) => {
      if (!payload) return;
      if (payload.type === "status_updated") {
        qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
        qc.invalidateQueries({ queryKey: ["support-tickets"] });
        return;
      }
      if (payload.ticketId && payload.ticketId !== ticketId) return;
      qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    [qc, ticketId]
  );

  const handleTicketUpdated = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
    qc.invalidateQueries({ queryKey: ["support-tickets"] });
  }, [qc, ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    const s = socketService.getNotificationsSocket();
    if (!s) return;

    const join = () => {
      s.emit("join_ticket", { ticketId });
    };
    join();
    s.on("connect", join);

    const onTyping = (p) => {
      if (p?.ticketId !== ticketId) return;
      if (p?.userId === user?.id) return;
      setTypingName(p?.name || "Someone");
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(null), 2500);
    };

    s.on("ticket_message", handleSocketMessage);
    s.on(`ticket_message_${ticketId}`, handleSocketMessage);
    s.on("ticket_updated", handleTicketUpdated);

    s.on("ticket_typing", onTyping);

    return () => {
      s.off("connect", join);
      s.emit("leave_ticket", { ticketId });
      s.off("ticket_message", handleSocketMessage);
      s.off(`ticket_message_${ticketId}`, handleSocketMessage);
      s.off("ticket_updated", handleTicketUpdated);
      s.off("ticket_typing", onTyping);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [ticketId, handleSocketMessage, handleTicketUpdated, user?.id]);

  const emitTyping = () => {
    const s = socketService.getNotificationsSocket();
    if (!s?.connected) return;
    s.emit("ticket_typing", {
      ticketId,
      userId: user?.id,
      name: user?.name,
    });
  };

  const onChangeText = (v) => {
    setText(v);
    emitTyping();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const m = text.trim();
    if (!m || sendMutation.isPending) return;
    setText("");
    sendMutation.mutate(m);
  };

  if (detailQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (detailQuery.error || !detailQuery.data?.ticket) {
    return (
      <div className="p-8 text-center text-red-600">
        {detailQuery.error?.message || "Ticket not found"}
      </div>
    );
  }

  const { ticket, messages } = detailQuery.data;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto">
      <aside className="lg:w-80 shrink-0 rounded-xl border border-border bg-card p-4 space-y-3 h-fit">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-lg font-semibold leading-tight">{ticket.title}</h1>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {ticket.description}
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-muted">{ticket.status}</span>
          <span className="px-2 py-0.5 rounded bg-muted">{ticket.priority}</span>
        </div>
        <dl className="text-xs space-y-1 text-muted-foreground">
          <div className="flex justify-between gap-2">
            <dt>Response SLA</dt>
            <dd>{formatDuration(ticket.sla?.responseTimeMs)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Resolution SLA</dt>
            <dd>{formatDuration(ticket.sla?.resolutionTimeMs)}</dd>
          </div>
        </dl>
      </aside>

      <section className="flex-1 flex flex-col rounded-xl border border-border bg-card min-h-[420px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(messages || []).map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.sender?.userId === user?.id
                  ? "ml-auto bg-blue-600 text-white"
                  : "mr-auto bg-muted"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-80 mb-1">
                {senderLabel(msg.sender?.role)}
              </span>
              <span className="whitespace-pre-wrap">{msg.message}</span>
              <span className="text-[10px] opacity-60 mt-1">
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleString()
                  : ""}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {typingName && (
          <div className="px-4 text-xs text-muted-foreground italic">
            {typingName} is typing…
          </div>
        )}
        <form
          onSubmit={onSubmit}
          className="border-t border-border p-3 flex gap-2 items-end"
        >
          <textarea
            className="flex-1 min-h-[44px] max-h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-y"
            placeholder="Type a message…"
            value={text}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={sendMutation.isPending}
            className="shrink-0 rounded-md bg-blue-600 text-white p-3 hover:bg-blue-700 disabled:opacity-50"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
