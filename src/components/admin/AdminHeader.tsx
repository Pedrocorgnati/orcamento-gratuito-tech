'use client'

import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

interface AdminHeaderProps {
  userEmail?: string
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    // Extrair locale do pathname atual (ex: /pt-BR/admin/leads → pt-BR)
    const locale = pathname.split('/')[1] ?? 'pt-BR'
    router.push(`/${locale}/admin`)
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-gray-900">
          Budget Free Engine — Admin
        </span>
      </div>
      <div className="flex items-center gap-3">
        {userEmail && (
          <span className="hidden sm:block text-xs text-gray-500 truncate max-w-[200px]">
            {userEmail}
          </span>
        )}
        <button
          onClick={handleSignOut}
          type="button"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-100"
        >
          Sair
        </button>
      </div>
    </header>
  )
}
