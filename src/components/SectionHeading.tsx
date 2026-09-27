import type { ReactNode } from 'react'

interface Props {
  eyebrow: string
  title: ReactNode
  children?: ReactNode
  align?: 'left' | 'center'
}

export default function SectionHeading({ eyebrow, title, children, align = 'center' }: Props) {
  const centered = align === 'center'
  return (
    <div className={`mb-10 max-w-2xl ${centered ? 'mx-auto text-center' : ''}`}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="text-3xl leading-tight font-bold sm:text-4xl lg:text-5xl">{title}</h2>
      {children && <p className="mt-4 text-cocoa-700">{children}</p>}
    </div>
  )
}
