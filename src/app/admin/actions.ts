'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { changePassword, destroySession, getCurrentUser, hasRole, login } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';
import { galleryItems, leads } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { setClaimStatus, updateClaimText } from '@/lib/domain/claims';
import { addNote, changeLeadStatus, deleteLeadData, LeadError } from '@/lib/domain/leads';
import { retryJob } from '@/lib/notify/outbox';
import { setMeasurementStatus, requestMeasurement } from '@/lib/domain/slots';
import { getRating, setSetting, SETTING_KEYS } from '@/lib/domain/settings';
import { isLeadStatus, LOST_REASONS, type LeadStatus, type LostReason } from '@/lib/domain/statuses';
import { storeUpload } from '@/lib/storage';

export type ActionState = { ok: boolean; message: string };

async function requireUser(role: 'owner' | 'manager' | 'viewer' = 'manager') {
  const user = await getCurrentUser();
  if (!user || !hasRole(user, role)) return null;
  return user;
}

const DENIED: ActionState = { ok: false, message: 'Нет доступа' };

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export async function loginAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (!email || !password) return { ok: false, message: 'Введите email и пароль' };

  const result = await login(email, password);
  if (!result.ok) return { ok: false, message: result.error };

  redirect(result.user.mustChangePassword ? '/admin/settings?first=1' : '/admin');
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect('/admin/login');
}

export async function changePasswordAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return DENIED;

  const password = String(formData.get('password') ?? '');
  const repeat = String(formData.get('password2') ?? '');
  if (password.length < 10) return { ok: false, message: 'Пароль должен быть не короче 10 символов' };
  if (password !== repeat) return { ok: false, message: 'Пароли не совпадают' };

  await changePassword(user.id, password);
  return { ok: true, message: 'Пароль изменён' };
}

/* -------------------------------------------------------------------------- */
/* Leads                                                                      */
/* -------------------------------------------------------------------------- */

export async function updateLeadStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const leadId = Number(formData.get('leadId'));
  const status = String(formData.get('status') ?? '');
  const lostReason = String(formData.get('lostReason') ?? '');
  const note = String(formData.get('note') ?? '').trim();

  if (!Number.isFinite(leadId) || !isLeadStatus(status)) return { ok: false, message: 'Некорректные данные' };
  if (status === 'lost' && !LOST_REASONS.includes(lostReason as LostReason)) {
    return { ok: false, message: 'Укажите причину отказа' };
  }

  try {
    await changeLeadStatus({
      leadId,
      to: status as LeadStatus,
      actorType: 'user',
      actorId: user.id,
      actorName: user.name || user.email,
      channel: 'admin',
      lostReason: status === 'lost' ? (lostReason as LostReason) : undefined,
      note: note || undefined,
      assigneeId: status === 'taken' ? user.id : undefined,
    });
  } catch (error) {
    return { ok: false, message: error instanceof LeadError ? error.message : 'Не удалось изменить статус' };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath('/admin/leads');
  return { ok: true, message: 'Статус обновлён' };
}

export async function addNoteAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const leadId = Number(formData.get('leadId'));
  const text = String(formData.get('text') ?? '').trim();
  if (!Number.isFinite(leadId) || text.length === 0) return { ok: false, message: 'Введите текст' };

  await addNote(leadId, text, user.name || user.email, user.id);
  revalidatePath(`/admin/leads/${leadId}`);
  return { ok: true, message: 'Заметка добавлена' };
}

export async function deleteLeadAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('owner');
  if (!user) return DENIED;

  const leadId = Number(formData.get('leadId'));
  if (!Number.isFinite(leadId)) return { ok: false, message: 'Некорректные данные' };

  await deleteLeadData(leadId, user.email);
  revalidatePath('/admin/leads');
  return { ok: true, message: 'Данные клиента удалены' };
}

export async function bookMeasurementAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const leadId = Number(formData.get('leadId'));
  const startsAt = String(formData.get('startsAt') ?? '');
  const address = String(formData.get('address') ?? '').trim();

  if (!Number.isFinite(leadId) || !startsAt) return { ok: false, message: 'Выберите дату и время' };

  const db = await getDb();
  const lead = (await db.select().from(leads).where(eq(leads.id, leadId)).limit(1))[0];
  if (!lead) return { ok: false, message: 'Заявка не найдена' };

  try {
    await requestMeasurement({
      leadId,
      startsAt: new Date(startsAt),
      address: address || lead.address || '',
      district: lead.district,
      actor: user.name || user.email,
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Не удалось назначить замер' };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath('/admin/measurements');
  return { ok: true, message: 'Замер назначен (ожидает подтверждения)' };
}

export async function setMeasurementStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const id = Number(formData.get('measurementId'));
  const status = String(formData.get('status') ?? '');
  if (!Number.isFinite(id) || !['pending', 'confirmed', 'done', 'cancelled'].includes(status)) {
    return { ok: false, message: 'Некорректные данные' };
  }

  await setMeasurementStatus(id, status as 'pending' | 'confirmed' | 'done' | 'cancelled', user.name || user.email);
  revalidatePath('/admin/measurements');
  return { ok: true, message: 'Замер обновлён' };
}

/* -------------------------------------------------------------------------- */
/* Claims registry                                                            */
/* -------------------------------------------------------------------------- */

export async function setClaimStatusAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('owner');
  if (!user) return DENIED;

  const key = String(formData.get('key') ?? '');
  const status = String(formData.get('status') ?? '');
  if (!key || !['confirmed', 'unconfirmed'].includes(status)) return { ok: false, message: 'Некорректные данные' };

  await setClaimStatus(key, status as 'confirmed' | 'unconfirmed', user.email);
  // Publishing a claim must take effect immediately, without a deploy (§5.2).
  revalidatePath('/', 'layout');
  return { ok: true, message: status === 'confirmed' ? 'Утверждение подтверждено' : 'Утверждение снято с публикации' };
}

export async function updateClaimTextAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('owner');
  if (!user) return DENIED;

  const key = String(formData.get('key') ?? '');
  const text = String(formData.get('textRu') ?? '').trim();
  if (!key) return { ok: false, message: 'Некорректные данные' };

  await updateClaimText(key, text);
  revalidatePath('/', 'layout');
  return { ok: true, message: 'Текст сохранён' };
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

export async function saveRatingAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const current = await getRating();
  const value = Number(String(formData.get('value') ?? '').replace(',', '.'));
  const ratingsCount = Number(formData.get('ratingsCount'));
  const reviewsCount = Number(formData.get('reviewsCount'));
  const checkedAt = String(formData.get('checkedAt') ?? '').trim() || current.checkedAt;

  if (!Number.isFinite(value) || value < 0 || value > 5) return { ok: false, message: 'Рейтинг должен быть от 0 до 5' };

  await setSetting(SETTING_KEYS.rating2gis, {
    value,
    ratingsCount: Number.isFinite(ratingsCount) ? ratingsCount : current.ratingsCount,
    reviewsCount: Number.isFinite(reviewsCount) ? reviewsCount : current.reviewsCount,
    checkedAt,
    url: String(formData.get('url') ?? current.url),
  });

  revalidatePath('/', 'layout');
  return { ok: true, message: 'Рейтинг 2ГИС обновлён' };
}

export async function saveReviewDelayAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const days = Number(formData.get('days'));
  if (!Number.isFinite(days) || days < 0 || days > 30) return { ok: false, message: 'Укажите от 0 до 30 дней' };

  await setSetting('review_request_delay_days', days);
  return { ok: true, message: 'Срок напоминания сохранён' };
}

/* -------------------------------------------------------------------------- */
/* Notifications / gallery                                                    */
/* -------------------------------------------------------------------------- */

export async function retryJobAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const id = Number(formData.get('jobId'));
  if (!Number.isFinite(id)) return { ok: false, message: 'Некорректные данные' };

  await retryJob(id);
  revalidatePath('/admin/notifications');
  return { ok: true, message: 'Уведомление поставлено в очередь повторно' };
}

export async function uploadGalleryAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return { ok: false, message: 'Выберите файлы' };

  const category = String(formData.get('category') ?? 'windows');
  const caption = String(formData.get('caption') ?? '').trim();
  const showOnHome = formData.get('showOnHome') === 'on';

  const db = await getDb();
  let added = 0;
  try {
    for (const file of files) {
      const stored = await storeUpload(file, 'gallery');
      await db.insert(galleryItems).values({
        storageKey: stored.storageKey,
        url: stored.url,
        category,
        caption,
        showOnHome,
      });
      added += 1;
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Не удалось загрузить файл' };
  }

  revalidatePath('/admin/gallery');
  revalidatePath('/raboty');
  revalidatePath('/');
  return { ok: true, message: `Загружено файлов: ${added}` };
}

export async function toggleGalleryItemAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser('manager');
  if (!user) return DENIED;

  const id = Number(formData.get('id'));
  const home = formData.get('home') === '1';
  const active = formData.get('active') === '1';
  if (!Number.isFinite(id)) return { ok: false, message: 'Некорректные данные' };

  const db = await getDb();
  await db.update(galleryItems).set({ showOnHome: home, active }).where(eq(galleryItems.id, id));
  revalidatePath('/admin/gallery');
  revalidatePath('/raboty');
  return { ok: true, message: 'Сохранено' };
}
