"use client";

import { useState, type FormEvent } from "react";

const SUPPORT = "https://wa.me/923156540714";

/** Support-assisted recovery until verified email delivery and expiring tokens are configured. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }
  return (
    <>
      {submitted ? (
        <div role="status">
          <p className="font-semibold">Recovery instructions</p>
          <p className="mt-2 text-muted">Automated reset emails are not enabled yet. No email has been sent and no password has been changed. Please contact academy support to verify your account and request a secure password reset.</p>
          <a className="btn btn-emerald mt-4" href={SUPPORT} target="_blank" rel="noopener noreferrer">Contact WhatsApp support</a>
          <p className="mt-3 text-muted">WhatsApp: +92 315 6540714. Never share your current password or verification codes.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4">
          <div>
            <label className="label" htmlFor="recovery-email">Account email</label>
            <input className="field" id="recovery-email" name="email" type="email" dir="ltr" autoComplete="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <p className="text-muted">Email reset delivery is not configured. We will show you how to contact support securely; this form does not send your email address.</p>
          <button className="btn btn-emerald w-full" type="submit">Continue to recovery options</button>
        </form>
      )}
    </>
  );
}
