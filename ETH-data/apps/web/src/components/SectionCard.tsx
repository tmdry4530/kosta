import type { PropsWithChildren, ReactNode } from 'react'

export function SectionCard({ title, eyebrow, children }: PropsWithChildren<{ title: string; eyebrow?: ReactNode }>) {
  return (
    <section className="bg-brand-surface border border-brand-border p-6 transition-colors hover:border-brand-border-strong rounded-none">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          {eyebrow ? <div className="font-display text-[12px] uppercase tracking-[1px] text-brand-muted mb-2">{eyebrow}</div> : null}
          <h2 className="text-[22px] text-brand-text font-body">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}
