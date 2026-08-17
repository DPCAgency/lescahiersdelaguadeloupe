'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Link2, Check } from 'lucide-react';

interface ShareBarProps {
  title: string;
  url?: string;
}

export function ShareBar({ title, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== 'undefined' ? window.location.href : '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleWebShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
      } catch {
        // ignore
      }
    } else {
      handleCopy();
    }
  };

  const enc = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(title);

  const links = [
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encTitle}%20${enc}`, color: 'hover:text-[#25D366]' },
    { label: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc}`, color: 'hover:text-[#1877F2]' },
    { label: 'X', icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encTitle}&url=${enc}`, color: 'hover:text-ink' },
    { label: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}`, color: 'hover:text-[#0A66C2]' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        <Share2 className="h-3.5 w-3.5" />
        Partager
      </span>
      {links.map((l) => {
        const Icon = l.icon;
        return (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Partager sur ${l.label}`}
            className={`flex h-9 w-9 items-center justify-center border border-border text-muted transition-colors hover:border-ink ${l.color}`}
          >
            <Icon className="h-4 w-4" />
          </a>
        );
      })}
      <button
        onClick={typeof navigator !== 'undefined' && 'share' in navigator ? handleWebShare : handleCopy}
        className="flex h-9 w-9 items-center justify-center border border-border text-muted transition-colors hover:border-ink hover:text-ink"
        aria-label="Copier le lien"
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
