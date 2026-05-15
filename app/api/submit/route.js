import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { createSubmission, updateSubmissionEmailStatus } from '../../../lib/submissions-db';

const resend = new Resend(process.env.RESEND_API_KEY);
const INTERNAL_EMAIL = 'rishabh@shakudo.io';

function getErrorMessage(error) {
  if (error instanceof Error) return error.message;
  return 'Unknown error';
}

export async function POST(req) {
  const { from, stack, note, submittedAt } = await req.json();

  if (!from?.name || !from?.company || !from?.email || !stack?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const stackRows = stack
    .map(c => `<tr><td style="padding:4px 12px 4px 0"><strong>${c.name}</strong></td><td style="color:#968d7e">${c.category}</td></tr>`)
    .join('');

  // 1. Persist submission to SQLite
  let submission;
  try {
    submission = await createSubmission({ from, stack, note, submittedAt });
  } catch (error) {
    console.error('Submission persistence error:', getErrorMessage(error));
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }

  // 2. Internal team notification
  try {
    await resend.emails.send({
      from: 'Shakudo Stack Builder <onboarding@resend.dev>',
      to: INTERNAL_EMAIL,
      reply_to: from.email,
      subject: `Stack submission — ${from.name} at ${from.company}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;color:#1a1a1a">
          <h2 style="margin:0 0 20px;font-size:22px">New stack submission</h2>
          <table style="margin-bottom:20px;font-size:14px">
            <tr><td style="padding:4px 16px 4px 0;color:#666">Name</td><td>${from.name}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;color:#666">Company</td><td>${from.company}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;color:#666">Email</td><td><a href="mailto:${from.email}">${from.email}</a></td></tr>
            <tr><td style="padding:4px 16px 4px 0;color:#666">Submitted</td><td>${submittedAt || submission.receivedAt}</td></tr>
            <tr><td style="padding:4px 16px 4px 0;color:#666">ID</td><td style="font-family:monospace;font-size:12px">${submission.id}</td></tr>
          </table>
          <h3 style="margin:0 0 10px;font-size:15px">Stack — ${stack.length} components</h3>
          <table style="font-size:13px;margin-bottom:20px">${stackRows}</table>
          ${note ? `<h3 style="margin:0 0 8px;font-size:15px">Note</h3><p style="font-size:14px;color:#444;margin:0">${note}</p>` : ''}
        </div>`,
    });
    await updateSubmissionEmailStatus(submission.id, 'internal', 'sent');
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('Internal email error:', message);
    await updateSubmissionEmailStatus(submission.id, 'internal', 'failed', message);
  }

  // 3. Customer acknowledgement
  try {
    await resend.emails.send({
      from: 'Shakudo Stack Builder <onboarding@resend.dev>',
      to: from.email,
      subject: `We received your stack — a Shakudo expert will be in touch.`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:560px;color:#1a1a1a">
          <p style="font-size:15px;margin:0 0 20px">Hi ${from.name},</p>
          <p style="font-size:15px;margin:0 0 20px">
            Thanks for submitting your stack. A Shakudo expert will review your selection and follow up
            within one business day with a tailored recommendation and deployment plan.
          </p>
          <h3 style="margin:0 0 10px;font-size:15px;color:#333">Your selected stack (${stack.length} components)</h3>
          <table style="font-size:13px;margin-bottom:24px">${stackRows}</table>
          ${note ? `<h3 style="margin:0 0 8px;font-size:15px;color:#333">Your note</h3><p style="font-size:14px;color:#555;margin:0 0 24px;padding:12px 16px;background:#f5f5f5;border-radius:6px">${note}</p>` : ''}
          <p style="font-size:13px;color:#888;margin:0;border-top:1px solid #eee;padding-top:16px">
            Shakudo · The operating system for AI and data · shakudo.io
          </p>
        </div>`,
    });
    await updateSubmissionEmailStatus(submission.id, 'ack', 'sent');
  } catch (error) {
    const message = getErrorMessage(error);
    console.error('ACK email error:', message);
    await updateSubmissionEmailStatus(submission.id, 'ack', 'failed', message);
  }

  return NextResponse.json({ ok: true, id: submission.id });
}
