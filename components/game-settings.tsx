'use client'

import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BrickWall, CornerDownLeft, Infinity as InfinityIcon, LockKeyhole, Maximize, MoveRight, SlidersHorizontal } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Separator } from '@/components/ui/separator'
import { type GameAction, type GameState } from '@/lib/snake-game'

export function GameSettings({ state, dispatch }: { state: GameState; dispatch: (action: GameAction) => void }) {
  const locked = state.status === 'playing' || state.status === 'paused'
  return (
    <aside className="flex flex-col gap-5">
      <section className="arcade-card game-settings p-5" aria-labelledby="settings-title">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="settings-title" className="text-base font-bold tracking-tight">Make it your game</h2>
            <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 id="mode-label" className="text-sm font-medium">Game mode</h3>
            <ToggleGroup className="w-full" variant="segmented" aria-labelledby="mode-label" value={[state.mode]} disabled={locked} spacing={1} onValueChange={(values) => {
              if (values[0] === 'classic' || values[0] === 'wrap') dispatch({ type: 'configure', mode: values[0] })
            }}>
              <ToggleGroupItem value="classic" aria-label="Classic mode"><Maximize data-icon="inline-start" />Classic</ToggleGroupItem>
              <ToggleGroupItem value="wrap" aria-label="Wrap-around mode"><InfinityIcon data-icon="inline-start" />Wrap-around</ToggleGroupItem>
            </ToggleGroup>
            <p className="min-h-10 text-sm leading-5 text-muted-foreground">
              {state.mode === 'classic' ? 'Keep it old-school. Watch out for the walls.' : 'No walls, no worries. Loop around the edges.'}
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <h3 id="speed-label" className="text-sm font-medium">Pick your pace</h3>
            <ToggleGroup className="w-full" variant="segmented" aria-labelledby="speed-label" value={[state.speed]} disabled={locked} spacing={1} onValueChange={(values) => {
              if (values[0] === 'easy' || values[0] === 'normal' || values[0] === 'fast') dispatch({ type: 'configure', speed: values[0] })
            }}>
              <ToggleGroupItem value="easy">Easy</ToggleGroupItem>
              <ToggleGroupItem value="normal">Normal</ToggleGroupItem>
              <ToggleGroupItem value="fast">Fast</ToggleGroupItem>
            </ToggleGroup>
            <p className="flex min-h-5 items-center gap-1.5 text-sm leading-5 text-muted-foreground">
              {locked ? <><LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />Restart to change settings.</> : state.speed === 'easy' ? 'A little more time to think.' : state.speed === 'normal' ? 'The sweet spot. You’ve got this.' : 'Quick bites. Quicker reflexes.'}
            </p>
          </div>
        </div>
      </section>

      <section id="how-to-play" className="scroll-mt-6 px-1" aria-labelledby="instructions-title">
        <div className="flex flex-col gap-3">
          <h2 id="instructions-title" className="text-base font-bold tracking-tight">A quick refresher</h2>
          <div id="game-instructions" className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-3"><span className="flex size-5 shrink-0 items-center justify-center"><span className="size-3 rounded bg-food" /></span>Eat a bite, grow a little. <span className="ml-auto font-mono text-foreground">+10</span></p>
            <p className="flex items-center gap-3"><BrickWall className="size-5 shrink-0" aria-hidden="true" />{state.mode === 'classic' ? 'Dodge the walls and yourself.' : 'Cross the edges, dodge yourself.'}</p>
            <p className="flex items-center gap-3"><MoveRight className="size-5 shrink-0" aria-hidden="true" />Keep moving. Beat your best.</p>
            <span className="sr-only">Click Start game, then use arrow keys or W A S D to turn. Space pauses or resumes. On touchscreens, swipe the board or use the direction buttons.</span>
          </div>
          <Separator />
          <div className="hidden flex-col gap-2 md:flex">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Move</span>
              <div className="flex items-center gap-1" aria-label="Arrow keys">
                <kbd className="keycap"><ArrowLeft className="size-3.5" /></kbd>
                <kbd className="keycap"><ArrowUp className="size-3.5" /></kbd>
                <kbd className="keycap"><ArrowDown className="size-3.5" /></kbd>
                <kbd className="keycap"><ArrowRight className="size-3.5" /></kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Also move</span>
              <div className="flex items-center gap-1" aria-label="W A S D keys">{['W', 'A', 'S', 'D'].map((key) => <kbd key={key} className="keycap">{key}</kbd>)}</div>
            </div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Pause / resume</span><kbd className="keycap">space<CornerDownLeft className="ml-2 size-3" aria-hidden="true" /></kbd></div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground md:hidden">Swipe on the board or use the arrow buttons to find your next bite.</p>
        </div>
      </section>
    </aside>
  )
}
