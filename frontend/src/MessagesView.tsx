import { useState } from 'react';
import type { AdminContactMessage, AdminMessageStatus } from './adminMessagesApi';
import { useAdminMessages, useDeleteAdminMessage } from './useAdminMessages';

const PAGE_SIZE = 20;

const statusLabels: Record<AdminMessageStatus, string> = {
  FAILED: 'Fallido',
  PENDING: 'Pendiente',
  SENT: 'Enviado',
};

function formatReceivedAt(value: string) {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusClassName(status: AdminMessageStatus) {
  if (status === 'SENT') return 'border-green-500/50 text-green-600';
  if (status === 'FAILED') return 'border-red-500/50 text-red-600';
  return 'border-yellow-500/50 text-yellow-700';
}

function MessageRow({
  message,
  onDelete,
}: {
  message: AdminContactMessage;
  onDelete: (message: AdminContactMessage) => void;
}) {
  const subject = encodeURIComponent(`Re: Mensaje de contacto de ${message.name}`);

  return (
    <article className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{message.name}</h2>
          <a className="text-sm text-accent hover:underline" href={`mailto:${message.email}?subject=${subject}`}>
            {message.email}
          </a>
          <p className="mt-1 text-sm text-text-muted">
            <time dateTime={message.createdAt}>{formatReceivedAt(message.createdAt)}</time>
          </p>
        </div>
        <span className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClassName(message.status)}`}>
          Estado: {statusLabels[message.status]}
        </span>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer font-medium">Leer mensaje</summary>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.message}</p>
      </details>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-bg"
          href={`mailto:${message.email}?subject=${subject}`}
        >
          Responder
        </a>
        <button
          className="rounded-md border border-red-500/60 px-3 py-2 text-sm text-red-600 hover:bg-red-500/10"
          onClick={() => onDelete(message)}
          type="button"
        >
          Eliminar
        </button>
      </div>
    </article>
  );
}

export default function MessagesView() {
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<AdminContactMessage | null>(null);
  const messagesQuery = useAdminMessages(page, PAGE_SIZE);
  const deleteMutation = useDeleteAdminMessage();

  async function confirmDelete() {
    if (!pendingDelete) return;
    await deleteMutation.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  }

  if (messagesQuery.isLoading) {
    return (
      <section aria-labelledby="messages-title">
        <h1 className="font-display text-3xl font-semibold" id="messages-title">Mensajes</h1>
        <p aria-live="polite" className="mt-4 text-text-muted">Cargando mensajes...</p>
      </section>
    );
  }

  if (messagesQuery.isError) {
    return (
      <section aria-labelledby="messages-title">
        <h1 className="font-display text-3xl font-semibold" id="messages-title">Mensajes</h1>
        <p className="mt-4 rounded-md border border-red-500/50 p-4 text-red-600" role="alert">
          No se pudieron cargar los mensajes.
        </p>
      </section>
    );
  }

  const data = messagesQuery.data;
  if (!data) {
    return (
      <section aria-labelledby="messages-title">
        <h1 className="font-display text-3xl font-semibold" id="messages-title">Mensajes</h1>
        <p className="mt-4 rounded-md border border-red-500/50 p-4 text-red-600" role="alert">
          No se pudieron cargar los mensajes.
        </p>
      </section>
    );
  }

  const messages = data.content;

  return (
    <section aria-labelledby="messages-title" className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold" id="messages-title">Mensajes</h1>
        <p className="mt-2 text-text-muted">Bandeja de mensajes de contacto.</p>
      </div>

      {pendingDelete && (
        <div aria-labelledby="delete-message-title" aria-modal="true" className="rounded-lg border border-yellow-500/50 bg-surface p-4" role="alertdialog">
          <h2 className="font-semibold" id="delete-message-title">¿Eliminar este mensaje?</h2>
          <p className="mt-2 text-sm text-text-muted">
            Esta acción no se puede deshacer. Se eliminará el mensaje de {pendingDelete.name}.
          </p>
          {deleteMutation.isError && (
            <p className="mt-2 text-sm text-red-600" role="alert">No se pudo eliminar el mensaje.</p>
          )}
          <div className="mt-4 flex gap-3">
            <button className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white" disabled={deleteMutation.isPending} onClick={() => void confirmDelete()} type="button">
              {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button className="rounded-md border border-border-control px-3 py-2 text-sm" onClick={() => setPendingDelete(null)} type="button">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {messages.length === 0 ? (
        <p className="rounded-lg border border-border p-6 text-text-muted">No hay mensajes para mostrar.</p>
      ) : (
        <div aria-live="polite" className="space-y-4">
          {messages.map((message) => (
            <MessageRow key={message.id} message={message} onDelete={setPendingDelete} />
          ))}
        </div>
      )}

      {data.totalPages > 1 && (
        <nav aria-label="Paginación de mensajes" className="flex items-center justify-between gap-4">
          <button
            className="rounded-md border border-border-control px-3 py-2 text-sm disabled:opacity-50"
            disabled={data.first}
            onClick={() => setPage((current) => current - 1)}
            type="button"
          >
            Anteriores
          </button>
          <span aria-live="polite" className="text-sm text-text-muted">
            Página {data.number + 1} de {data.totalPages}
          </span>
          <button
            className="rounded-md border border-border-control px-3 py-2 text-sm disabled:opacity-50"
            disabled={data.last}
            onClick={() => setPage((current) => current + 1)}
            type="button"
          >
            Siguientes
          </button>
        </nav>
      )}
    </section>
  );
}
