'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';

export function RightOfReplyForm() {
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [organization, setOrganization] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [certified, setCertified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Le nom est obligatoire.';
    if (!email.trim()) e.email = 'L\'email est obligatoire.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Adresse email invalide.';
    if (!articleUrl.trim()) e.articleUrl = 'L\'URL de l\'article est obligatoire.';
    else if (!/^https?:\/\/.+/.test(articleUrl)) e.articleUrl = 'URL invalide (doit commencer par http:// ou https://).';
    if (!subject.trim()) e.subject = 'L\'objet est obligatoire.';
    if (!message.trim()) e.message = 'Le message est obligatoire.';
    else if (message.length > 8000) e.message = 'Le message est trop long (8000 caractères maximum).';
    if (!certified) e.certified = 'Vous devez certifier l\'exactitude des informations transmises.';
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
      const resp = await fetch('/api/droit-reponse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, first_name: firstName, organization, position, email, phone, article_url: articleUrl, subject, message, certified }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || 'Une erreur est survenue. Réessayez dans quelques instants.');
      }
      setSuccess(true);
      setName(''); setFirstName(''); setOrganization(''); setPosition('');
      setEmail(''); setPhone(''); setArticleUrl(''); setSubject(''); setMessage(''); setCertified(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-border bg-background-soft p-8 text-center">
        <p className="font-display text-lg font-semibold text-ink">Demande envoyée.</p>
        <p className="mt-2 text-sm text-text">La rédaction examinera votre demande et vous répondra dans les meilleurs délais.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Envoyer une autre demande
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
          <label htmlFor="rr-name" className="mb-1.5 block text-[13px] font-medium text-ink">
            Nom <span className="text-primary">*</span>
          </label>
          <input id="rr-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
            className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.name ? 'border-red-300' : 'border-border'}`}
            aria-invalid={!!errors.name} aria-describedby={errors.name ? 'rr-name-err' : undefined} />
          {errors.name && <p id="rr-name-err" className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="rr-firstname" className="mb-1.5 block text-[13px] font-medium text-ink">Prénom</label>
          <input id="rr-firstname" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100}
            className="w-full rounded border border-border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rr-org" className="mb-1.5 block text-[13px] font-medium text-ink">Organisation</label>
          <input id="rr-org" type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} maxLength={200}
            className="w-full rounded border border-border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary" />
        </div>
        <div>
          <label htmlFor="rr-position" className="mb-1.5 block text-[13px] font-medium text-ink">Fonction</label>
          <input id="rr-position" type="text" value={position} onChange={(e) => setPosition(e.target.value)} maxLength={200}
            className="w-full rounded border border-border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rr-email" className="mb-1.5 block text-[13px] font-medium text-ink">
            Email <span className="text-primary">*</span>
          </label>
          <input id="rr-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200}
            className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.email ? 'border-red-300' : 'border-border'}`}
            aria-invalid={!!errors.email} aria-describedby={errors.email ? 'rr-email-err' : undefined} />
          {errors.email && <p id="rr-email-err" className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="rr-phone" className="mb-1.5 block text-[13px] font-medium text-ink">Téléphone</label>
          <input id="rr-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30}
            className="w-full rounded border border-border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary" />
        </div>
      </div>

      <div>
        <label htmlFor="rr-url" className="mb-1.5 block text-[13px] font-medium text-ink">
          URL de l'article concerné <span className="text-primary">*</span>
        </label>
        <input id="rr-url" type="url" value={articleUrl} onChange={(e) => setArticleUrl(e.target.value)} maxLength={500}
          className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.articleUrl ? 'border-red-300' : 'border-border'}`}
          placeholder="https://lescahiersdelaguadeloupe.fr/..."
          aria-invalid={!!errors.articleUrl} aria-describedby={errors.articleUrl ? 'rr-url-err' : undefined} />
        {errors.articleUrl && <p id="rr-url-err" className="mt-1 text-xs text-red-600">{errors.articleUrl}</p>}
      </div>

      <div>
        <label htmlFor="rr-subject" className="mb-1.5 block text-[13px] font-medium text-ink">
          Objet <span className="text-primary">*</span>
        </label>
        <input id="rr-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200}
          className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.subject ? 'border-red-300' : 'border-border'}`}
          aria-invalid={!!errors.subject} aria-describedby={errors.subject ? 'rr-subject-err' : undefined} />
        {errors.subject && <p id="rr-subject-err" className="mt-1 text-xs text-red-600">{errors.subject}</p>}
      </div>

      <div>
        <label htmlFor="rr-message" className="mb-1.5 block text-[13px] font-medium text-ink">
          Message <span className="text-primary">*</span>
        </label>
        <textarea id="rr-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} maxLength={8000}
          className={`w-full rounded border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors focus:border-primary ${errors.message ? 'border-red-300' : 'border-border'}`}
          aria-invalid={!!errors.message} aria-describedby={errors.message ? 'rr-message-err' : undefined} />
        {errors.message && <p id="rr-message-err" className="mt-1 text-xs text-red-600">{errors.message}</p>}
      </div>

      <div>
        <label className="flex items-start gap-3 text-[14px] text-text">
          <input type="checkbox" checked={certified} onChange={(e) => setCertified(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-border accent-primary"
            aria-invalid={!!errors.certified} aria-describedby={errors.certified ? 'rr-cert-err' : undefined} />
          <span>Je certifie l'exactitude des informations transmises.</span>
        </label>
        {errors.certified && <p id="rr-cert-err" className="mt-1 text-xs text-red-600">{errors.certified}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-editorial flex items-center gap-2 disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Envoyer la demande
      </button>
    </form>
  );
}
