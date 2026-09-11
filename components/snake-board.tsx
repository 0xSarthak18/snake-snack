'use client'

import { useId, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { ArrowRight, Pause, Play, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GRID_SIZE, type Direction, type GameState } from '@/lib/snake-game'

const CELL = 24
const ROTATIONS: Record<Direction, number> = { right: 0, down: 90, left: 180, up: 270 }
const KEYS: Record<string, Direction> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
}

export function SnakeBoard({ state, boardRef, onToggle, onTurn }: {
  state: GameState
  boardRef: RefObject<HTMLDivElement | null>
  onToggle: () => void
  onTurn: (direction: Direction) => void
}) {
  const patternId = useId()
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null)
  const { status, snake, food, direction } = state

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.ctrlKey || event.metaKey || event.altKey) return
    if ((event.target as HTMLElement).closest('button, input, select, textarea, a')) return
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
    if (KEYS[key]) {
      event.preventDefault()
      onTurn(KEYS[key])
    } else if ((key === ' ' || key === 'Escape') && !event.repeat) {
      event.preventDefault()
      if (key !== 'Escape' || status === 'playing') onToggle()
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return
    boardRef.current?.focus({ preventScroll: true })
    if (event.pointerType === 'mouse') return
    pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return
    onTurn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
    pointerStart.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
  }

  const heading = status === 'ready' ? 'Ready, set, snake.' : status === 'paused' ? 'Take a breather.' : status === 'won' ? 'Quite the appetite.' : 'One more round?'
  const description = status === 'ready' ? 'A small snake. A big appetite.' : status === 'paused' ? 'Your next bite can wait.' : status === 'won' ? 'You filled the entire board. Incredible.' : state.collision === 'wall' ? 'That wall came out of nowhere.' : 'A little too wrapped up in yourself.'

  return (
    <div
      ref={boardRef}
      className="board-frame"
      tabIndex={0}
      role="application"
      aria-label="Snake game board"
      aria-describedby="game-instructions"
      data-testid="game-board"
      data-status={status}
      onKeyDown={handleKey}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => { pointerStart.current = null }}
      onPointerCancel={() => { pointerStart.current = null }}
    >
      <svg viewBox={`0 0 ${GRID_SIZE * CELL} ${GRID_SIZE * CELL}`} className="block aspect-square w-full" aria-hidden="true">
        <defs>
          <pattern id={patternId} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
            <rect width={CELL} height={CELL} className="board-grid" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        {snake.map((segment, index) => (
          <g key={`${segment.x}-${segment.y}`} transform={`translate(${segment.x * CELL}, ${segment.y * CELL})`} data-snake-segment={index}>
            <rect x="1" y="1" width="22" height="22" rx={index === 0 ? 7 : 5} fill="var(--primary)" opacity={index === 0 ? 1 : Math.max(0.42, 0.87 - index * 0.045)} />
            {index === 0 && (
              <g transform={`rotate(${ROTATIONS[direction]}, 12, 12)`}>
                <circle cx="15.5" cy="7.8" r="3.1" fill="var(--card)" />
                <circle cx="15.5" cy="16.2" r="3.1" fill="var(--card)" />
                <circle cx="16.5" cy="7.8" r="1.4" fill="var(--foreground)" />
                <circle cx="16.5" cy="16.2" r="1.4" fill="var(--foreground)" />
              </g>
            )}
          </g>
        ))}
        {food && (
          <g transform={`translate(${food.x * CELL}, ${food.y * CELL})`} data-testid="food">
            <circle cx="12" cy="12" r="11" fill="var(--food)" opacity="0.16" />
            <rect x="4" y="4" width="16" height="16" rx="6" fill="var(--food)" />
            <rect x="7" y="7" width="4" height="3" rx="1.5" fill="var(--card)" opacity="0.6" />
          </g>
        )}
      </svg>
      {status !== 'playing' && (
        <div className="board-overlay" data-status={status}>
          <div className="flex max-w-full flex-col items-center gap-5 px-4">
            {status === 'paused' && <Pause className="size-7 text-primary" aria-hidden="true" />}
            {status === 'won' && <Trophy className="size-8 text-primary" aria-hidden="true" />}
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-balance text-2xl font-extrabold tracking-tight sm:text-[28px]">{heading}</h2>
              <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            {(status === 'over' || status === 'won') && (
              <p className="font-mono text-3xl font-medium tabular-nums">{state.score}<span className="font-sans text-sm text-muted-foreground"> points</span></p>
            )}
            <Button size="lg" onClick={onToggle} className="h-11 min-w-40 rounded-xl px-5">
              {status === 'over' || status === 'won' ? <RotateCcw data-icon="inline-start" /> : <Play data-icon="inline-start" fill="currentColor" />}
              {status === 'ready' ? 'Start game' : status === 'paused' ? 'Keep going' : 'Play again'}
              <ArrowRight data-icon="inline-end" />
            </Button>
            {status === 'ready' && <p className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">or press <kbd className="keycap">space</kbd></p>}
          </div>
        </div>
      )}
    </div>
  )
}
