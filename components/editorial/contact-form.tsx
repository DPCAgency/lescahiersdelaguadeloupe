'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

const SUBJECTS = [
  'Information / témoignage',
  'Proposition de sujet',
  'Question sur un article',
  'Contacter la rédaction',
  'Partenariat',
  'Problème technique',
  'Données personnelles',
  'Autre',
] as const;

export function ContactForm() {
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Le nom est obligatoire.';
    if (!email.trim()) e.email = 'L\'email est obligatoire.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Adresse email invalide.';
    if (!subject) e.subject = 'Veuillez choisir un objet.';
    if (!message.trim()) e.message = 'Le message est obligatoire.';
    else if (message.length > 5000) e.message = 'Le message est trop long (5000 caractères maximum).';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    setSuccess(false);
    if (!validate()) return;

    setLoading(true);
    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, first_name: firstName, email, phone, subject, message }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Une erreur est survenue. Réessayez dans quelques instants.');
      }
      setSuccess(true);
      setName(''); setFirstName(''); setEmail(''); setPhone(''); setSubject(''); setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-border bg-background-soft p-8 text-center">
        <p className="font-display text-lg font-semibold text-ink">Message envoyé.</p>
        <p className="mt-2 text-sm text-text">La rédaction vous répondra dans les meilleurs délais.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="mb-1.5 block text-[13px] font-medium text-ink">
            Nom <span className="text-primary">*</span>
          </label>
          <input
            id="cf-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.name ? 'border-red-300' : 'border-border'}`}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'cf-name-err' : undefined}
          />
          {errors.name && <p id="cf-name-err" className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="cf-firstname" className="mb-1.5 block text-[13px] font-medium text-ink">
            Prénom
          </label>
          <input
            id="cf-firstname"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            maxLength={100}
            className="w-full rounded border border-border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-email" className="mb-1.5 block text-[13px] font-medium text-ink">
            Email <span className="text-primary">*</span>
          </label>
          <input
            id="cf-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={200}
            className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.email ? 'border-red-300' : 'border-border'}`}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'cf-email-err' : undefined}
          />
          {errors.email && <p id="cf-email-err" className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="cf-phone" className="mb-1.5 block text-[13px] font-medium text-ink">
            Téléphone
          </label>
          <input
            id="cf-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className="w-full rounded border border-border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label htmlFor="cf-subject" className="mb-1.5 block text-[13px] font-medium text-ink">
          Objet <span className="text-primary">*</span>
        </label>
        <select
          id="cf-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.subject ? 'border-red-300' : 'border-border'}`}
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? 'cf-subject-err' : undefined}
        >
          <option value="">Choisir un objet</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.subject && <p id="cf-subject-err" className="mt-1 text-xs text-red-600">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="cf-message" className="mb-1.5 block text-[13px] font-medium text-ink">
          Message <span className="text-primary">*</span>
        </label>
        <textarea
          id="cf-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          maxLength={5000}
          className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.message ? 'border-red-300' : 'border-border'}`}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'cf-message-err' : undefined}
        />
        {errors.message && <p id="cf-message-err" className="mt-1 text-xs text-red-600">{errors.message}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-editorial flex items-center gap-2 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer
      </button>
    </form>
  );
}
