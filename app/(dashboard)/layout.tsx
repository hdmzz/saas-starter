'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import { use, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CircleIcon, Home, LogOut, Coins } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/lib/auth';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';

function UserMenuContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, refreshUser } = useUser();
  let tokens = user?.tokens;
  const router = useRouter();

  useEffect(() => {
    tokens = user?.tokens;
  }, [user?.tokens]);

  async function handleSignOut() {
    await signOut();
    refreshUser();
    router.refresh();
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Prix
        </Link>
        <Button
          asChild
          className="bg-black hover:bg-gray-800 text-white text-sm px-4 py-2 rounded-full"
        >
          <Link href="/sign-up">S'inscrire</Link>
        </Button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Coins className="h-4 w-4" />
        <span>Tokens: {tokens}</span>
      </div>
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger>
          <Avatar className="cursor-pointer size-9">
            <AvatarImage alt={user.name || ''} />
            <AvatarFallback>
              {user.email
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="flex flex-col gap-1">
          <DropdownMenuItem className="cursor-pointer">
            <Link href="/dashboard" className="flex w-full items-center">
              <Home className="mr-2 h-4 w-4" />
              <span>Tableau de bord</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <div className="flex w-full items-center">
              <Coins className="mr-2 h-4 w-4" />
              <span>Tokens: {user.tokens || 0}</span>
            </div>
          </DropdownMenuItem>
          <form action={handleSignOut} className="w-full">
            <button type="submit" className="flex w-full">
              <DropdownMenuItem className="w-full flex-1 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </button>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Composant serveur principal
function Header() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <span className="ml-2 text-xl font-semibold text-gray-900">Vinted Sales Booster</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenuContent />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      <Header />
      {children}
    </section>
  );
}
