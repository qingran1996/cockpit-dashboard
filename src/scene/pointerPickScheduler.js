export function createPointerPickScheduler({ requestFrame, cancelFrame, pick, publish }) {
  let frameId = null
  let latestEvent = null
  let interacting = false

  const cancelPending = () => {
    if (frameId === null) return
    cancelFrame(frameId)
    frameId = null
  }

  const schedule = () => {
    if (interacting || !latestEvent || frameId !== null) return
    frameId = requestFrame(() => {
      frameId = null
      if (interacting || !latestEvent) return
      const event = latestEvent
      publish(pick(event), event)
    })
  }

  return {
    move(event) {
      latestEvent = event
      schedule()
    },
    setInteracting(active) {
      interacting = active
      if (active) cancelPending()
      else schedule()
    },
    leave() {
      latestEvent = null
      cancelPending()
      publish(null, null)
    },
    dispose() {
      latestEvent = null
      cancelPending()
    },
  }
}
