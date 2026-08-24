import assert from 'node:assert/strict'
import test from 'node:test'

function createFrameHarness() {
  let nextId = 1
  const callbacks = new Map()
  return {
    requestFrame(callback) {
      const id = nextId++
      callbacks.set(id, callback)
      return id
    },
    cancelFrame(id) {
      callbacks.delete(id)
    },
    flush() {
      const pending = [...callbacks.values()]
      callbacks.clear()
      pending.forEach((callback) => callback())
    },
    get size() {
      return callbacks.size
    },
  }
}

test('coalesces rapid pointer moves into one pick using the latest event', async () => {
  const { createPointerPickScheduler } = await import('../src/scene/pointerPickScheduler.js')
  const frames = createFrameHarness()
  const picked = []
  const scheduler = createPointerPickScheduler({
    requestFrame: frames.requestFrame,
    cancelFrame: frames.cancelFrame,
    pick: (event) => `building-${event.clientX}`,
    publish: (result, event) => picked.push([result, event.clientX]),
  })

  scheduler.move({ clientX: 10 })
  scheduler.move({ clientX: 20 })

  assert.equal(frames.size, 1)
  assert.deepEqual(picked, [])
  frames.flush()
  assert.deepEqual(picked, [['building-20', 20]])
})

test('pauses picking during camera interaction and resumes with the latest pointer', async () => {
  const { createPointerPickScheduler } = await import('../src/scene/pointerPickScheduler.js')
  const frames = createFrameHarness()
  const picked = []
  const scheduler = createPointerPickScheduler({
    requestFrame: frames.requestFrame,
    cancelFrame: frames.cancelFrame,
    pick: (event) => event.clientX,
    publish: (result) => picked.push(result),
  })

  scheduler.move({ clientX: 10 })
  scheduler.setInteracting(true)
  scheduler.move({ clientX: 30 })
  frames.flush()
  assert.deepEqual(picked, [])

  scheduler.setInteracting(false)
  assert.equal(frames.size, 1)
  frames.flush()
  assert.deepEqual(picked, [30])
})

test('leave clears the pending pick and publishes an empty result', async () => {
  const { createPointerPickScheduler } = await import('../src/scene/pointerPickScheduler.js')
  const frames = createFrameHarness()
  const picked = []
  const scheduler = createPointerPickScheduler({
    requestFrame: frames.requestFrame,
    cancelFrame: frames.cancelFrame,
    pick: () => 'building',
    publish: (result, event) => picked.push([result, event]),
  })

  scheduler.move({ clientX: 10 })
  scheduler.leave()
  frames.flush()

  assert.deepEqual(picked, [[null, null]])
})
