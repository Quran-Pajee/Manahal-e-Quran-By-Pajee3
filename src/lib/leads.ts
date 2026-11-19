import { randomUUID } from "crypto";
import type { Lead, LeadInput, LeadStatus } from "./lead-types";
import { q, one, storageMode, NoStorageError, type StorageMode } from "./db";

/** Trial requests. Storage is described in ./db.ts. */
export { storageMode, NoStorageError };
export type { StorageMode };

export async function createLead(input: LeadInput): Promise<Lead> {
  const now = new Date().toISOString();
  const l: Lead = { id: randomUUID(), createdAt: now, updatedAt: now, status: "new", notes: "", ...input };
  await q(
    `insert into leads (id, created_at, updated_at, status, notes, name, phone, email, country, course, student_for, student_age,
       teacher_pref, class_type, student_count, preferred_time, timezone, message, source_page, landing_page, referrer,
       utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, fbclid)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
    [l.id, l.createdAt, l.updatedAt, l.status, l.notes, l.name, l.phone, l.email, l.country, l.course, l.studentFor, l.studentAge,
      l.teacherPref, l.classType, l.studentCount, l.preferredTime, l.timezone, l.message, l.sourcePage, l.landingPage, l.referrer,
      l.utmSource, l.utmMedium, l.utmCampaign, l.utmTerm, l.utmContent, l.gclid, l.fbclid],
  );
  return l;
}

export async function listLeads(): Promise<Lead[]> {
  if (storageMode() === "none") return [];
  return q<Lead>(`select * from leads order by created_at desc limit 5000`);
}

export async function getLead(id: string): Promise<Lead | null> {
  if (storageMode() === "none") return null;
  return one<Lead>(`select * from leads where id = $1`, [id]);
}

export async function updateLead(id: string, patch: { status?: LeadStatus; notes?: string }): Promise<void> {
  if (storageMode() === "none") return;
  const now = new Date().toISOString();
  if (patch.status !== undefined) await q(`update leads set status = $1, updated_at = $2 where id = $3`, [patch.status, now, id]);
  if (patch.notes !== undefined) await q(`update leads set notes = $1, updated_at = $2 where id = $3`, [patch.notes, now, id]);
}

export async function deleteLead(id: string): Promise<void> {
  if (storageMode() === "none") return;
  await q(`delete from leads where id = $1`, [id]);
}
