'use client';

import { useActionState } from 'react';
import type { ReactNode } from 'react';

import type { ActionState } from '@/app/admin/actions';

const INITIAL: ActionState = { ok: true, message: '' };

/**
 * Thin wrapper around a server action that shows the result message and keeps
 * the submit button in a pending state. Keeps every admin form consistent
 * without repeating the plumbing.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  className = '',
  variant = 'cta',
  confirm,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children?: ReactNode;
  submitLabel: string;
  className?: string;
  variant?: 'cta' | 'outline' | 'danger';
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const buttonClass =
    variant === 'cta'
      ? 'btn btn-cta'
      : variant === 'danger'
        ? 'btn border border-danger text-danger'
        : 'btn btn-outline';

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {children}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="submit" className={buttonClass} disabled={pending} aria-busy={pending}>
          {pending ? 'Сохраняем…' : submitLabel}
        </button>
        {state.message ? (
          <span className={`text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
