import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppAdminAuth } from '../contexts/AppAdminAuthContext';
import {
  getAppAdminSupportTicket,
  postAppAdminSupportTicketMessage,
  putAppAdminSupportTicketStatus,
  postAppAdminSupportTicketRead,
  platformAppAdminPseudoUserId,
} from '../../api/appAdminSupportTicketsApi';
import socketService from '@/services/socketService';

function senderLabel(role) {
  switch (role) {
    case 'APP_ADMIN':
      return 'Platform';
    case 'SUPERADMIN':
      return 'SuperAdmin';
    case 'ADMIN':
      return 'Admin';
    case 'DOCTOR':
      return 'Doctor';
    default:
      return role || 'User';
  }
}

function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '< 1m';
}

export default function AppAdminTicketChatPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { admin } = useAppAdminAuth();
  const qc = useQueryClient();
  const bottomRef = useRef(null);
  const [text, setText] = useState('');
  const [typingName, setTypingName] = useState(null);
  const typingTimer = useRef(null);

  const myPseudoUserId = admin?.id != null ? platformAppAdminPseudoUserId(admin.id) : null;

  useEffect(() => {
    if (admin?.id == null) return;
    socketService.connectNotifications(String(admin.id), null, {});
  }, [admin?.id]);

  const detailQuery = useQuery({
    queryKey: ['app-admin', 'support-ticket', ticketId],
    queryFn: () => getAppAdminSupportTicket(ticketId),
    enabled: !!ticketId,
  });

  const sendMutation = useMutation({
    mutationFn: (message) => postAppAdminSupportTicketMessage(ticketId, { message }),
    onMutate: async (message) => {
      await qc.cancelQueries({ queryKey: ['app-admin', 'support-ticket', ticketId] });
      const prev = qc.getQueryData(['app-admin', 'support-ticket', ticketId]);
      const optimistic = {
        id: `temp-${Date.now()}`,
        ticketId,
        sender: { userId: myPseudoUserId, role: 'APP_ADMIN' },
        message,
        attachments: [],
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData(['app-admin', 'support-ticket', ticketId], (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...(old.messages || []), optimistic],
        };
      });
      return { prev };
    },
    onError: (err, _msg, ctx) => {
      if (ctx?.prev) qc.setQueryData(['app-admin', 'support-ticket', ticketId], ctx.prev);
      toast.error(err.message || 'Send failed');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['app-admin', 'support-ticket', ticketId] });
      qc.invalidateQueries({ queryKey: ['app-admin', 'support-tickets'] });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: () => putAppAdminSupportTicketStatus(ticketId, { status: 'RESOLVED' }),
    onSuccess: () => {
      toast.success('Ticket marked resolved');
      qc.invalidateQueries({ queryKey: ['app-admin', 'support-ticket', ticketId] });
      qc.invalidateQueries({ queryKey: ['app-admin', 'support-tickets'] });
    },
    onError: (err) => toast.error(err.message || 'Could not update status'),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detailQuery.data?.messages?.length]);

  useEffect(() => {
    if (!ticketId) return;
    postAppAdminSupportTicketRead(ticketId).catch(() => {});
  }, [ticketId]);

  const handleSocketMessage = useCallback(
    (payload) => {
      if (!payload) return;
      if (payload.type === 'status_updated') {
        qc.invalidateQueries({ queryKey: ['app-admin', 'support-ticket', ticketId] });
        qc.invalidateQueries({ queryKey: ['app-admin', 'support-tickets'] });
        return;
      }
      if (payload.ticketId && payload.ticketId !== ticketId) return;
      qc.invalidateQueries({ queryKey: ['app-admin', 'support-ticket', ticketId] });
      qc.invalidateQueries({ queryKey: ['app-admin', 'support-tickets'] });
    },
    [qc, ticketId]
  );

  const handleTicketUpdated = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['app-admin', 'support-ticket', ticketId] });
    qc.invalidateQueries({ queryKey: ['app-admin', 'support-tickets'] });
  }, [qc, ticketId]);

  useEffect(() => {
    if (!ticketId) return;
    const s = socketService.getNotificationsSocket();
    if (!s) return;

    const join = () => {
      s.emit('join_ticket', { ticketId });
    };
    join();
    s.on('connect', join);

    const onTyping = (p) => {
      if (p?.ticketId !== ticketId) return;
      if (String(p?.userId) === String(admin?.id)) return;
      setTypingName(p?.name || 'Someone');
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTypingName(null), 2500);
    };

    s.on('ticket_message', handleSocketMessage);
    s.on(`ticket_message_${ticketId}`, handleSocketMessage);
    s.on('ticket_updated', handleTicketUpdated);
    s.on('ticket_typing', onTyping);

    return () => {
      s.off('connect', join);
      s.emit('leave_ticket', { ticketId });
      s.off('ticket_message', handleSocketMessage);
      s.off(`ticket_message_${ticketId}`, handleSocketMessage);
      s.off('ticket_updated', handleTicketUpdated);
      s.off('ticket_typing', onTyping);
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [ticketId, handleSocketMessage, handleTicketUpdated, admin?.id]);

  const emitTyping = () => {
    const s = socketService.getNotificationsSocket();
    if (!s?.connected) return;
    s.emit('ticket_typing', {
      ticketId,
      userId: admin?.id,
      name: admin?.name,
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
    setText('');
    sendMutation.mutate(m);
  };

  if (detailQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (detailQuery.error || !detailQuery.data?.ticket) {
    return (
      <div className="p-8 text-center text-red-600">
        {detailQuery.error?.message || 'Ticket not found'}
      </div>
    );
  }

  const { ticket, messages } = detailQuery.data;
  const isResolved = ticket.status === 'RESOLVED';

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      <aside className="lg:w-80 shrink-0 rounded-xl border border-gray-200 bg-white p-4 space-y-3 h-fit shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/queries')}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tickets
        </button>
        <h1 className="text-lg font-semibold leading-tight text-gray-900">{ticket.title}</h1>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.description}</p>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">{ticket.status}</span>
          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">{ticket.priority}</span>
        </div>
        <dl className="text-xs space-y-1 text-gray-500">
          <div className="flex justify-between gap-2">
            <dt>Response SLA</dt>
            <dd>{formatDuration(ticket.sla?.responseTimeMs)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt>Resolution SLA</dt>
            <dd>{formatDuration(ticket.sla?.resolutionTimeMs)}</dd>
          </div>
        </dl>
        {!isResolved ? (
          <button
            type="button"
            onClick={() => resolveMutation.mutate()}
            disabled={resolveMutation.isPending}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            {resolveMutation.isPending ? 'Updating…' : 'Mark resolved'}
          </button>
        ) : (
          <p className="text-xs text-gray-500">This ticket is resolved. Reopen from the hospital side if needed.</p>
        )}
      </aside>

      <section className="flex-1 flex flex-col rounded-xl border border-gray-200 bg-white min-h-[420px] shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {(messages || []).map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.sender?.userId === myPseudoUserId
                  ? 'ml-auto bg-blue-600 text-white'
                  : 'mr-auto bg-gray-100 text-gray-900'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-80 mb-1">
                {senderLabel(msg.sender?.role)}
              </span>
              <span className="whitespace-pre-wrap">{msg.message}</span>
              <span className="text-[10px] opacity-60 mt-1">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {typingName && (
          <div className="px-4 text-xs text-gray-500 italic">{typingName} is typing…</div>
        )}
        <form
          onSubmit={onSubmit}
          className="border-t border-gray-200 p-3 flex gap-2 items-end"
        >
          <textarea
            className="flex-1 min-h-[44px] max-h-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm resize-y text-gray-900"
            placeholder={isResolved ? 'Ticket is resolved' : 'Type a message…'}
            value={text}
            disabled={isResolved}
            onChange={(e) => onChangeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={sendMutation.isPending || isResolved}
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
