export const GRID_SIZE = 20
export const POINTS_PER_FOOD = 10
export const SPEEDS = { easy: 220, normal: 150, fast: 95 } as const

export type Point = { x: number; y: number }
export type Direction = 'up' | 'down' | 'left' | 'right'
export type GameMode = 'classic' | 'wrap'
export type Speed = keyof typeof SPEEDS
export type GameStatus = 'ready' | 'playing' | 'paused' | 'over' | 'won'

export type GameState = {
  snake: Point[]
  food: Point | null
  direction: Direction
  queue: Direction[]
  mode: GameMode
  speed: Speed
  status: GameStatus
  score: number
  collision: 'wall' | 'body' | null
}

export type GameAction =
  | { type: 'tick'; random: number }
  | { type: 'turn'; direction: Direction }
  | { type: 'toggle' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'configure'; mode?: GameMode; speed?: Speed }

const VECTORS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const OPPOSITE: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
}

export function samePoint(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y
}

export function createGame(mode: GameMode = 'classic', speed: Speed = 'normal'): GameState {
  return {
    snake: [
      { x: 7, y: 13 }, { x: 6, y: 13 }, { x: 5, y: 13 },
      { x: 5, y: 14 }, { x: 5, y: 15 }, { x: 5, y: 16 },
    ],
    food: { x: 13, y: 13 },
    direction: 'right',
    queue: [],
    mode,
    speed,
    status: 'ready',
    score: 0,
    collision: null,
  }
}

export function spawnFood(snake: Point[], random: number): Point | null {
  const occupied = new Set(snake.map(({ x, y }) => y * GRID_SIZE + x))
  const empty: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(y * GRID_SIZE + x)) empty.push({ x, y })
    }
  }
  if (!empty.length) return null
  const sample = Number.isFinite(random) ? Math.max(0, Math.min(random, 1 - Number.EPSILON)) : 0
  return empty[Math.floor(sample * empty.length)]
}

export function advanceGame(state: GameState, random: number): GameState {
  if (state.status !== 'playing') return state
  const direction = state.queue[0] ?? state.direction
  const vector = VECTORS[direction]
  let head = { x: state.snake[0].x + vector.x, y: state.snake[0].y + vector.y }
  if (state.mode === 'wrap') {
    head = { x: (head.x + GRID_SIZE) % GRID_SIZE, y: (head.y + GRID_SIZE) % GRID_SIZE }
  } else if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
    return { ...state, direction, queue: [], status: 'over', collision: 'wall' }
  }
  const growing = state.food !== null && samePoint(head, state.food)
  // The last cell is vacated this tick unless the snake is eating.
  const body = growing ? state.snake : state.snake.slice(0, -1)
  if (body.some((segment) => samePoint(segment, head))) {
    return { ...state, direction, queue: [], status: 'over', collision: 'body' }
  }
  const snake = [head, ...body]
  const food = growing ? spawnFood(snake, random) : state.food
  return {
    ...state,
    snake,
    food,
    direction,
    queue: state.queue.slice(1),
    score: state.score + (growing ? POINTS_PER_FOOD : 0),
    status: food === null ? 'won' : 'playing',
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'tick':
      return advanceGame(state, action.random)
    case 'turn': {
      if (state.status !== 'playing' || state.queue.length >= 2) return state
      const lastDirection = state.queue.at(-1) ?? state.direction
      if (action.direction === lastDirection || action.direction === OPPOSITE[lastDirection]) return state
      return { ...state, queue: [...state.queue, action.direction] }
    }
    case 'toggle':
      if (state.status === 'playing') return { ...state, status: 'paused' }
      if (state.status === 'paused') return { ...state, status: 'playing' }
      return { ...createGame(state.mode, state.speed), status: 'playing' }
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state
    case 'reset':
      return createGame(state.mode, state.speed)
    case 'configure':
      if (state.status === 'playing' || state.status === 'paused') return state
      return createGame(action.mode ?? state.mode, action.speed ?? state.speed)
  }
}

export function parseBestScore(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 0
  const score = Number(value)
  return Number.isSafeInteger(score) && score >= 0 && score <= (GRID_SIZE * GRID_SIZE - 6) * POINTS_PER_FOOD && score % POINTS_PER_FOOD === 0 ? score : 0
}
