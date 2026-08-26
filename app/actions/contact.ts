'use server';

import { createClient } from '@/lib/supabase/server';
import { sendTransactionalEmail } from '@/lib/notifications/email';
import { rateLimit } from '@/lib/security/rate-limit';

export type ContactInput = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export type ActionResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export async function submitContactAction(input: ContactInput): Promise<ActionResponse> {
  const { name, email, subject, message } = input;

  if (!name || name.trim().length < 2) {
    return { success: false, error: 'Name must be at least 2 characters.' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }
  if (!subject || subject.trim().length < 3) {
    return { success: false, error: 'Please select or enter a subject.' };
  }
  if (!message || message.trim().length < 10) {
    return { success: false, error: 'Message must be at least 10 characters.' };
  }

  const rl = await rateLimit({ key: `contact:${email.toLowerCase()}`, limit: 5, windowMs: 10 * 60_000 });
  if (!rl.ok) {
    return { success: false, error: 'Too many messages. Please wait before sending again.' };
  }

  let ticketStored = false;
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('support_tickets').insert([
      {
        name,
        email,
        subject,
        message,
        cc: 'orders@playR.in',
        created_at: new Date().toISOString(),
      },
    ]);
    ticketStored = !error;
  } catch {
    ticketStored = false;
  }

  const ack = await sendTransactionalEmail({
    to: email,
    template: 'contact_ack',
    html: `<p>We received your message, ${name}.</p><p>Subject: ${subject}</p>`,
    text: `We received your message (${subject}).`,
  });

  if (!ticketStored && !ack.sent) {
    return {
      success: false,
      error: ack.error || 'Could not store or send your message. Try again or email orders@playR.in.',
    };
  }
  if (ticketStored && !ack.sent) {
    return {
      success: true,
      message: 'Message received. Confirmation email could not be sent — our team still has your request.',
    };
  }
  if (!ticketStored && ack.sent) {
    return {
      success: true,
      message: 'Message emailed. Our team will reply soon.',
    };
  }

  return {
    success: true,
    message: 'Message received. Our team will reply soon.',
  };
}
