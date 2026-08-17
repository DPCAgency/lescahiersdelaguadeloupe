'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface NewsletterSectionProps {
  title: string;
  text: string;
  placeholder: string;
  buttonText: string;
  notice: string;
}

export function NewsletterSection({ title, text, placeholder, buttonText, notice }: NewsletterSectionProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="border-t border-border">
      <div className="container-editorial py-14 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">La lettre</p>
            <h2 className="section-title mt-3 text-[28px] sm:text-[36px] lg:text-[44px]">
              {title}
            </h2>
            <p className="mt-3 max-w-lg text-[16px] leading-relaxed text-text">{text}</p>
          </div>
          <div className="lg:col-span-5">
            {submitted ? (
              <div className="border border-primary bg-primary-light p-6">
                <p className="text-[15px] font-semibold text-primary-dark">
                  Merci. Votre inscription sera confirmée par email.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="flex flex-col gap-3"
              >
                <label htmlFor="newsletter-email" className="eyebrow-muted">
                  Email
                </label>
                <div className="flex items-center border border-ink">
                  <input
                    id="newsletter-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-transparent px-4 py-3 text-[15px] text-ink outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    className="shrink-0 bg-ink px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-primary"
                  >
                    {buttonText}
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>
                </div>
                <p className="text-[11px] text-muted">{notice}</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
