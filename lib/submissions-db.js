import { mkdirSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sqlite3 from 'sqlite3';

const dataDir = path.join(process.cwd(), '.data');
const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'stack-builder.sqlite');

let dbPromise;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, err => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function getDb() {
  if (!dbPromise) {
    mkdirSync(dataDir, { recursive: true });
    dbPromise = openDatabase();
    const db = await dbPromise;
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS stack_submissions (
        id TEXT PRIMARY KEY,
        contact_name TEXT NOT NULL,
        company_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        stack_json TEXT NOT NULL,
        note TEXT,
        client_submitted_at TEXT,
        received_at TEXT NOT NULL,
        ack_email_status TEXT NOT NULL,
        internal_email_status TEXT NOT NULL,
        ack_email_error TEXT,
        internal_email_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`
    );
  }

  return dbPromise;
}

function nowIso() {
  return new Date().toISOString();
}

export async function createSubmission({ from, stack, note, submittedAt }) {
  const db = await getDb();
  const id = crypto.randomUUID();
  const timestamp = nowIso();

  await run(
    db,
    `INSERT INTO stack_submissions (
      id,
      contact_name,
      company_name,
      contact_email,
      stack_json,
      note,
      client_submitted_at,
      received_at,
      ack_email_status,
      internal_email_status,
      ack_email_error,
      internal_email_error,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      from.name,
      from.company,
      from.email,
      JSON.stringify(stack),
      note || null,
      submittedAt || null,
      timestamp,
      'pending',
      'pending',
      null,
      null,
      timestamp,
      timestamp,
    ]
  );

  return { id, receivedAt: timestamp };
}

export async function updateSubmissionEmailStatus(id, field, status, errorMessage = null) {
  const db = await getDb();
  const updatedAt = nowIso();

  if (field === 'internal') {
    await run(
      db,
      `UPDATE stack_submissions
       SET internal_email_status = ?,
           internal_email_error = ?,
           updated_at = ?
       WHERE id = ?`,
      [status, errorMessage, updatedAt, id]
    );
    return;
  }

  await run(
    db,
    `UPDATE stack_submissions
     SET ack_email_status = ?,
         ack_email_error = ?,
         updated_at = ?
     WHERE id = ?`,
    [status, errorMessage, updatedAt, id]
  );
}
