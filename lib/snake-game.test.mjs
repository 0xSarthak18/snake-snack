import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, advanceGame, gameReducer, spawnFood, samePoint, parseBestScore, GRID_SIZE } from './snake-game.ts'

const playing = (overrides = {}) => ({ ...createGame(), status: 'playing', ...overrides })

test('snake advances one cell without growing between meals', () => {
  const initial = playing()
  const next = advanceGame(initial, 0.5)
  assert.equal(next.snake.length, initial.snake.length)
  assert.deepEqual(next.snake[0], { x: 8, y: 13 })
  assert.equal(next.score, 0)
  assert.deepEqual(initial.snake[0], { x: 7, y: 13 })
})

test('eating food grows the snake and adds ten points', () => {
  const initial = playing({ food: { x: 8, y: 13 } })
  const next = advanceGame(initial, 0.5)
  assert.equal(next.snake.length, initial.snake.length + 1)
  assert.equal(next.score, 10)
  assert.ok(!next.snake.some((segment) => samePoint(segment, next.food)))
})

for (const [direction, head, expected] of [
  ['right', { x: 19, y: 8 }, { x: 0, y: 8 }],
  ['left', { x: 0, y: 8 }, { x: 19, y: 8 }],
  ['up', { x: 8, y: 0 }, { x: 8, y: 19 }],
  ['down', { x: 8, y: 19 }, { x: 8, y: 0 }],
]) {
  test(`classic wall collision toward ${direction}`, () => {
    const next = advanceGame(playing({ direction, snake: [head] }), 0)
    assert.equal(next.status, 'over')
    assert.equal(next.collision, 'wall')
  })
  test(`wrap-around toward ${direction}`, () => {
    const next = advanceGame(playing({ direction, snake: [head], mode: 'wrap' }), 0)
    assert.equal(next.status, 'playing')
    assert.deepEqual(next.snake[0], expected)
  })
}

test('body collisions end the game in both modes', () => {
  for (const mode of ['classic', 'wrap']) {
    const next = advanceGame(playing({ mode, direction: 'down', snake: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }] }), 0)
    assert.equal(next.status, 'over')
    assert.equal(next.collision, 'body')
  }
})

test('moving into the departing tail is legal', () => {
  const next = advanceGame(playing({ direction: 'down', snake: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 3 }, { x: 2, y: 3 }] }), 0)
  assert.equal(next.status, 'playing')
  assert.deepEqual(next.snake[0], { x: 2, y: 3 })
})

test('turn queue ignores reversals, duplicates, and excess inputs', () => {
  let state = playing()
  assert.equal(gameReducer(state, { type: 'turn', direction: 'left' }), state)
  assert.equal(gameReducer(state, { type: 'turn', direction: 'right' }), state)
  state = gameReducer(state, { type: 'turn', direction: 'up' })
  assert.equal(gameReducer(state, { type: 'turn', direction: 'down' }), state)
  state = gameReducer(state, { type: 'turn', direction: 'left' })
  assert.equal(gameReducer(state, { type: 'turn', direction: 'down' }), state)
  assert.deepEqual(state.queue, ['up', 'left'])
  state = advanceGame(state, 0)
  assert.equal(state.direction, 'up')
  assert.deepEqual(state.queue, ['left'])
  state = advanceGame(state, 0)
  assert.equal(state.direction, 'left')
})

test('pause and game-over stop ticks and directional input', () => {
  for (const status of ['ready', 'paused', 'over', 'won']) {
    const state = playing({ status })
    assert.equal(advanceGame(state, 0), state)
    assert.equal(gameReducer(state, { type: 'turn', direction: 'up' }), state)
  }
})

test('pause, resume, and restart preserve the selected settings', () => {
  let state = playing({ mode: 'wrap', speed: 'fast', score: 70 })
  state = gameReducer(state, { type: 'pause' })
  assert.equal(state.status, 'paused')
  state = gameReducer(state, { type: 'toggle' })
  assert.equal(state.status, 'playing')
  assert.equal(state.score, 70)
  state = gameReducer(state, { type: 'reset' })
  assert.equal(state.status, 'ready')
  assert.equal(state.mode, 'wrap')
  assert.equal(state.speed, 'fast')
  assert.equal(state.score, 0)
  assert.deepEqual(state.queue, [])
})

test('settings are locked during play and pause', () => {
  for (const status of ['playing', 'paused']) {
    const state = playing({ status })
    assert.equal(gameReducer(state, { type: 'configure', mode: 'wrap', speed: 'easy' }), state)
  }
  const state = gameReducer(createGame(), { type: 'configure', mode: 'wrap', speed: 'easy' })
  assert.equal(state.mode, 'wrap')
  assert.equal(state.speed, 'easy')
})

test('food only spawns in unoccupied cells and handles a full board', () => {
  const all = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({ x: i % GRID_SIZE, y: Math.floor(i / GRID_SIZE) }))
  assert.equal(spawnFood(all, 0.5), null)
  for (const random of [0, 0.2, 0.99, 1, NaN]) {
    assert.deepEqual(spawnFood(all.slice(1), random), { x: 0, y: 0 })
  }
})

test('eating the last empty cell wins the game', () => {
  const all = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => ({ x: i % GRID_SIZE, y: Math.floor(i / GRID_SIZE) }))
  const state = playing({ snake: [{ x: 1, y: 0 }, ...all.slice(2)], food: { x: 0, y: 0 }, direction: 'left', score: 3930 })
  const next = advanceGame(state, 0)
  assert.equal(next.status, 'won')
  assert.equal(next.food, null)
  assert.equal(next.snake.length, 400)
  assert.equal(next.score, 3940)
})

test('best score validation rejects malformed and impossible values', () => {
  for (const bad of [null, '', '-10', 'banana', 'Infinity', '20.5', '15', '4000', '{}']) assert.equal(parseBestScore(bad), 0)
  assert.equal(parseBestScore('100'), 100)
  assert.equal(parseBestScore('3940'), 3940)
})
