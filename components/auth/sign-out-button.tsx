'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  )
}
