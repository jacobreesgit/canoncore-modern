/**
 * Site Footer Component
 * Reusable footer with attribution following Context7 best practices
 */

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 flex-row px-8 h-14">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built with Next.js, NextAuth.js, and Drizzle ORM
        </p>
      </div>
    </footer>
  )
}