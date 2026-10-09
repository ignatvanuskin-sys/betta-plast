import { setClaimStatusAction, updateClaimTextAction } from '../../actions';
import { ActionForm } from '@/components/admin/ActionForm';
import { getClaimsMap } from '@/lib/domain/claims';
import { CLAIM_SEED } from '@/lib/domain/claims-seed';

export const dynamic = 'force-dynamic';

/**
 * «Чек-лист для владельца» (§5.2): every open question in one place. Confirming
 * a claim publishes the block on the site immediately — no deploy needed.
 */
export default async function AdminClaimsPage() {
  const claims = await getClaimsMap();

  const rows = CLAIM_SEED.map((seed) => ({
    seed,
    claim: claims.get(seed.key),
  }));

  const unconfirmed = rows.filter((row) => (row.claim?.status ?? 'unconfirmed') !== 'confirmed');
  const confirmed = rows.filter((row) => (row.claim?.status ?? 'unconfirmed') === 'confirmed');

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-xl font-bold">Реестр утверждений</h1>
        <p className="mt-2 text-sm text-ink-soft">
          На сайте публикуется только подтверждённое. Ответьте на вопросы — и блок появится сам, без участия
          разработчика.
        </p>
        <p className="mt-2 text-sm">
          Ждут ответа: <strong>{unconfirmed.length}</strong> · подтверждено: <strong>{confirmed.length}</strong>
        </p>
      </div>

      <section className="grid gap-4">
        <h2 className="font-semibold">Нужен ответ владельца</h2>
        {unconfirmed.map(({ seed, claim }) => (
          <article key={seed.key} className="card">
            <p className="font-semibold">{seed.questionRu}</p>
            <p className="hint mt-1">
              Ключ: {seed.key} · источник: {seed.source}
              {seed.note ? ` · ${seed.note}` : ''}
            </p>

            <ActionForm action={updateClaimTextAction} submitLabel="Сохранить формулировку" className="mt-3" variant="outline">
              <input type="hidden" name="key" value={seed.key} />
              <label className="label" htmlFor={`text-${seed.key}`}>
                Текст для сайта (оставьте пустым, если публиковать нечего)
              </label>
              <textarea
                id={`text-${seed.key}`}
                name="textRu"
                className="field min-h-16"
                defaultValue={claim?.textRu ?? ''}
              />
            </ActionForm>

            <ActionForm action={setClaimStatusAction} submitLabel="Подтвердить и опубликовать" className="mt-3">
              <input type="hidden" name="key" value={seed.key} />
              <input type="hidden" name="status" value="confirmed" />
            </ActionForm>
          </article>
        ))}
        {unconfirmed.length === 0 ? <p className="hint">Все утверждения подтверждены — отлично.</p> : null}
      </section>

      <section className="grid gap-4">
        <h2 className="font-semibold">Опубликовано</h2>
        {confirmed.map(({ seed, claim }) => (
          <article key={seed.key} className="card">
            <p className="font-medium">{claim?.textRu}</p>
            <p className="hint mt-1">
              Ключ: {seed.key} · подтвердил: {claim?.confirmedBy ?? '—'} ·{' '}
              {claim?.confirmedAt ? new Date(claim.confirmedAt).toLocaleDateString('ru-RU') : '—'}
            </p>
            <ActionForm action={setClaimStatusAction} submitLabel="Снять с публикации" className="mt-3" variant="outline">
              <input type="hidden" name="key" value={seed.key} />
              <input type="hidden" name="status" value="unconfirmed" />
            </ActionForm>
          </article>
        ))}
      </section>
    </div>
  );
}
