'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CircleHelp, Gamepad2, Pause, Play, RotateCcw, Trophy, Worm } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SnakeBoard } from '@/components/snake-board'
import { GameSettings } from '@/components/game-settings'
import { createGame, gameReducer, parseBestScore, SPEEDS, type Direction } from '@/lib/snake-game'

const STATUS_LABELS = { ready: 'Ready when you are', playing: 'Looking for a bite', paused: 'Taking a breather', over: 'Nice run', won: 'Board complete' }

function useBestScore(key: string, score: number) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const memory = useRef<Record<string, number>>({})
  useEffect(() => {
    function sync() {
      let stored = 0
      try { stored = parseBestScore(window.localStorage.getItem(key)) } catch { /* Private browsing may disable storage; keep the score in memory. */ }
      const best = Math.max(stored, score, memory.current[key] ?? 0)
      memory.current[key] = best
      setScores((previous) => previous[key] === best ? previous : { ...previous, [key]: best })
      if (best > stored) {
        try { window.localStorage.setItem(key, String(best)) } catch { /* Gameplay remains available without browser storage. */ }
      }
    }
    sync()
    const handleStorage = (event: StorageEvent) => { if (event.key === key) sync() }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key, score])
  return Math.max(score, scores[key] ?? 0)
}

export function SnakeGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => createGame())
  const boardRef = useRef<HTMLDivElement>(null)
  const best = useBestScore(`snake:best:v1:${state.mode}:${state.speed}`, state.score)
  const active = state.status === 'playing'
  const canPause = active || state.status === 'paused'

  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => dispatch({ type: 'tick', random: Math.random() }), SPEEDS[state.speed])
    return () => window.clearInterval(timer)
  }, [active, state.speed])

  useEffect(() => {
    const pause = () => dispatch({ type: 'pause' })
    const visibility = () => { if (document.hidden) pause() }
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.removeEventListener('blur', pause)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])

  const focusBoard = useCallback(() => boardRef.current?.focus({ preventScroll: true }), [])
  const toggle = useCallback(() => { dispatch({ type: 'toggle' }); focusBoard() }, [focusBoard])
  const turn = useCallback((direction: Direction) => { dispatch({ type: 'turn', direction }) }, [])
  const reset = () => { dispatch({ type: 'reset' }); focusBoard() }

  return (
    <div className="min-h-svh">
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-2.5" aria-label="Snake arcade">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Worm className="size-6 -rotate-12" strokeWidth={2.3} aria-hidden="true" /></span>
            <span className="text-2xl font-extrabold tracking-tighter">snake<span className="text-primary">.</span></span>
            <span className="hidden border-l border-border pl-4 text-sm text-muted-foreground sm:ml-3 sm:block">A good old time.</span>
          </div>
          <a href="#how-to-play" className="flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"><CircleHelp className="size-4" aria-hidden="true" />How to play</a>
        </div>
      </header>

      <main className="arcade-main mx-auto max-w-[776px] px-5 pb-2 pt-6 sm:px-7">
        <section className="entrance pb-5 text-center" aria-labelledby="page-title">
          <h1 id="page-title" className="text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] sm:text-[42px]">Just one more <span className="text-primary">bite.</span></h1>
          <p className="pt-1 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">A little nostalgia. A fresh little challenge.</p>
        </section>

        <div className="entrance entrance-late grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_264px]">
          <section aria-label="Play Snake" className="flex min-w-0 flex-col gap-3">
            <div className="arcade-card p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-muted-foreground">Your score</span>
                    <span data-testid="score" className="font-mono text-[28px] font-medium leading-tight tracking-tight tabular-nums">{String(state.score).padStart(3, '0')}</span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5" title="Saved in this browser for the selected mode and speed">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"><Trophy className="size-3.5 text-primary" aria-hidden="true" />Personal best</span>
                    <span data-testid="best-score" className="font-mono text-[28px] font-medium leading-tight tracking-tight text-primary tabular-nums">{String(best).padStart(3, '0')}</span>
                  </div>
                </div>
                <SnakeBoard state={state} boardRef={boardRef} onToggle={toggle} onTurn={turn} />
                <div className="flex items-center justify-between px-1">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />{STATUS_LABELS[state.status]}</p>
                  <span className="font-mono text-sm text-muted-foreground" aria-label="20 by 20 grid">20 × 20</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <Badge variant="secondary"><Gamepad2 data-icon="inline-start" />{state.mode === 'classic' ? 'Classic' : 'Wrap-around'}<span aria-hidden="true">·</span>{state.speed === 'easy' ? 'Easy' : state.speed === 'normal' ? 'Normal' : 'Fast'}</Badge>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-9" disabled={!canPause} onClick={toggle}>
                  {state.status === 'paused' ? <Play data-icon="inline-start" /> : <Pause data-icon="inline-start" />}
                  {state.status === 'paused' ? 'Resume' : 'Pause'}
                </Button>
                <Separator orientation="vertical" className="my-2" />
                <Button variant="ghost" size="sm" className="h-9" onClick={reset} disabled={state.status === 'ready'}><RotateCcw data-icon="inline-start" />Restart</Button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 md:hidden" aria-label="Touch controls">
              <Button variant="outline" size="icon-lg" className="size-12" disabled={!active} aria-label="Move up" onClick={() => { turn('up'); focusBoard() }}><ArrowUp /></Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon-lg" className="size-12" disabled={!active} aria-label="Move left" onClick={() => { turn('left'); focusBoard() }}><ArrowLeft /></Button>
                <Button variant="outline" size="icon-lg" className="size-12" disabled={!active} aria-label="Move down" onClick={() => { turn('down'); focusBoard() }}><ArrowDown /></Button>
                <Button variant="outline" size="icon-lg" className="size-12" disabled={!active} aria-label="Move right" onClick={() => { turn('right'); focusBoard() }}><ArrowRight /></Button>
              </div>
            </div>
          </section>
          <GameSettings state={state} dispatch={dispatch} />
        </div>
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{STATUS_LABELS[state.status]}. Score: {state.score}. {state.status === 'over' ? 'Game over. Play again to try for a new best.' : ''}</p>
      </main>
      <footer className="mx-auto max-w-[856px] px-5 pb-5 pt-3 text-center text-sm text-muted-foreground sm:px-7">
        No rush. No downloads. Just you and the next bite.
      </footer>
    </div>
  )
}
