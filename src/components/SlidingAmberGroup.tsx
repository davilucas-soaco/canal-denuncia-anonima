import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { cn } from '../utils/cn'

export type SlidingAmberItem = {
  label: string
  href?: string
  onClick?: () => void
  /** Mark the default gradient target */
  primary?: boolean
  className?: string
}

type SlidingAmberGroupProps = {
  items: SlidingAmberItem[]
  className?: string
  itemClassName?: string
  idleClassName?: string
}

export function SlidingAmberGroup({
  items,
  className,
  itemClassName,
  idleClassName = 'text-white/75',
}: SlidingAmberGroupProps) {
  const primaryIndex = items.findIndex((item) => item.primary)
  const defaultIndex = primaryIndex >= 0 ? primaryIndex : 0
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const [active, setActive] = useState(defaultIndex)
  const [pill, setPill] = useState({ x: 0, y: 0, w: 0, h: 0, ready: false })
  const hoveringRef = useRef(false)
  const activeRef = useRef(defaultIndex)

  const movePill = useCallback(
    (index: number) => {
      const container = containerRef.current
      if (!container) return

      const resolveVisible = (i: number) => {
        const el = itemRefs.current[i]
        if (!el) return null
        if (getComputedStyle(el).display === 'none') return null
        if (el.offsetWidth === 0 && el.offsetHeight === 0) return null
        return el
      }

      let el = resolveVisible(index)
      let next = index
      if (!el) {
        el = resolveVisible(defaultIndex)
        next = defaultIndex
      }
      if (!el) {
        const firstVisible = items.findIndex((_, i) => resolveVisible(i))
        if (firstVisible < 0) return
        el = resolveVisible(firstVisible)
        next = firstVisible
      }
      if (!el) return

      const c = container.getBoundingClientRect()
      const b = el.getBoundingClientRect()
      setActive(next)
      activeRef.current = next
      setPill({
        x: b.left - c.left,
        y: b.top - c.top,
        w: b.width,
        h: b.height,
        ready: true,
      })
    },
    [defaultIndex, items],
  )

  useLayoutEffect(() => {
    movePill(defaultIndex)
  }, [defaultIndex, movePill])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const refresh = () => {
      movePill(hoveringRef.current ? activeRef.current : defaultIndex)
    }

    const ro = new ResizeObserver(refresh)
    ro.observe(container)
    window.addEventListener('resize', refresh)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', refresh)
    }
  }, [defaultIndex, movePill])

  function handleLeave() {
    hoveringRef.current = false
    movePill(defaultIndex)
  }

  function bindHover(index: number) {
    return {
      onMouseEnter: () => {
        hoveringRef.current = true
        movePill(index)
      },
      onFocus: () => {
        hoveringRef.current = true
        movePill(index)
      },
    }
  }

  const itemBaseClass = (index: number, extra?: string) =>
    cn(
      'relative z-10 inline-flex items-center justify-center rounded-xl font-bold no-underline transition-colors duration-300',
      itemClassName,
      extra,
      active === index ? 'text-brand-navy' : idleClassName,
    )

  return (
    <div
      ref={containerRef}
      className={cn('relative flex items-center', className)}
      onMouseLeave={handleLeave}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          handleLeave()
        }
      }}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute left-0 top-0 z-0 rounded-xl',
          'bg-[linear-gradient(135deg,#ffe28f_0%,#ffad00_45%,#e89200_100%)]',
          'transition-[transform,width,height,opacity] duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          pill.ready ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          width: pill.w,
          height: pill.h,
          transform: `translate(${pill.x}px, ${pill.y}px)`,
          boxShadow: '0 8px 22px rgba(255, 173, 0, 0.28)',
        }}
      />

      {items.map((item, index) =>
        item.href ? (
          <a
            key={item.label}
            ref={(node) => {
              itemRefs.current[index] = node
            }}
            href={item.href}
            className={itemBaseClass(index, item.className)}
            {...bindHover(index)}
          >
            {item.label}
          </a>
        ) : (
          <button
            key={item.label}
            type="button"
            ref={(node) => {
              itemRefs.current[index] = node
            }}
            onClick={item.onClick}
            className={itemBaseClass(index, item.className)}
            {...bindHover(index)}
          >
            {item.label}
          </button>
        ),
      )}
    </div>
  )
}
