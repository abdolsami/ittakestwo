const CTX = new WeakMap()

// reuse one 2d context per canvas. alpha:false skips compositing;
// desynchronized lowers input-to-pixel latency where the browser allows it.
export function get2d(canvas) {
  if (!canvas) return null
  let ctx = CTX.get(canvas)
  if (!ctx) {
    ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d')
    ctx.imageSmoothingEnabled = false
    CTX.set(canvas, ctx)
  }
  return ctx
}

export function makeLayer(width, height, paint) {
  const layer = document.createElement('canvas')
  layer.width = width
  layer.height = height
  const ctx = layer.getContext('2d')
  ctx.imageSmoothingEnabled = false
  paint(ctx)
  return layer
}
