'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Home,
  FileText,
  BookOpen,
  ScanLine,
  Image as ImageIcon,
  FolderTree,
  MapPin,
  Users,
  Menu,
  Settings,
  Search,
  ShoppingCart,
  UserCircle,
  Palette,
  HelpCircle,
  PenLine,
} from 'lucide-react';
import { AdminGuard } from './admin-guard';

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['author', 'editor', 'admin', 'super_admin'] },
  { label: 'Mes articles', href: '/admin/mes-articles', icon: PenLine, roles: ['author'] },
  { label: 'Mes Cahiers', href: '/admin/mes-cahiers', icon: BookOpen, roles: ['author'] },
  { label: 'Articles', href: '/admin/articles', icon: FileText, roles: ['editor', 'admin', 'super_admin'] },
  { label: 'Accueil', href: '/admin/homepage', icon: Home, roles: ['editor', 'admin', 'super_admin'] },
  { label: 'Cahiers', href: '/admin/cahiers', icon: BookOpen, roles: ['editor', 'admin', 'super_admin'] },
  { label: 'Import intelligent', href: '/admin/import', icon: ScanLine, roles: ['admin', 'super_admin'] },
  { label: 'Médias', href: '/admin/medias', icon: ImageIcon, roles: ['author', 'editor', 'admin', 'super_admin'] },
  { label: 'Rubriques', href: '/admin/rubriques', icon: FolderTree, roles: ['admin', 'super_admin'] },
  { label: 'Territoires', href: '/admin/territoires', icon: MapPin, roles: ['admin', 'super_admin'] },
  { label: 'Auteurs', href: '/admin/auteurs', icon: Users, roles: ['admin', 'super_admin'] },
  { label: 'Navigation', href: '/admin/navigation', icon: Menu, roles: ['admin', 'super_admin'] },
  { label: 'Pages', href: '/admin/pages', icon: FileText, roles: ['admin', 'super_admin'] },
  { label: 'Lecteurs', href: '/admin/lecteurs', icon: UserCircle, roles: ['admin', 'super_admin'] },
  { label: 'Commandes', href: '/admin/commandes', icon: ShoppingCart, roles: ['admin', 'super_admin'] },
  { label: 'SEO', href: '/admin/seo', icon: Search, roles: ['admin', 'super_admin'] },
  { label: 'Mon profil', href: '/admin/mon-profil', icon: UserCircle, roles: ['author', 'editor', 'admin', 'super_admin'] },
  { label: 'Aide', href: '/admin/aide', icon: HelpCircle, roles: ['author', 'editor', 'admin', 'super_admin'] },
  { label: 'Paramètres', href: '/admin/settings', icon: Settings, roles: ['admin', 'super_admin'] },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<string>('admin');

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (resp.ok) {
          const data = await resp.json() as { role?: string };
          if (data.role) setRole(data.role);
        }
      } catch { /* ignore */ }
    })();
  }, []);

  const navItems = allNavItems.filter((item) => item.roles.includes(role));

  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-neutral-50">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-neutral-200 bg-white">
          <div className="flex h-16 items-center border-b border-neutral-200 px-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-ink">Les Cahiers</span>
              <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                {role === 'author' ? 'Auteur' : 'Admin'}
              </span>
            </Link>
          </div>
          <nav className="flex flex-col gap-0.5 overflow-y-auto p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/admin/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-ink text-white'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-neutral-200 p-3">
            <Link href="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-neutral-500 hover:bg-neutral-100">
              <Palette className="h-3.5 w-3.5" strokeWidth={1.5} />
              Retour au site
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6">
            <h1 className="font-display text-base font-semibold text-neutral-800">
              {navItems.find((n) => pathname === n.href || pathname?.startsWith(n.href))?.label ?? 'Administration'}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400">Les Cahiers de la Guadeloupe</span>
            </div>
          </header>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </AdminGuard>
  );
}
