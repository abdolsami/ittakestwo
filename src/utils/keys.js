// true when a keyboard event is happening inside a text field (chat box, name
// input, etc). global game/park key handlers use this to stay out of the way so
// typing a message never also drives the game or gets swallowed.
export function isTypingInField(e) {
  const eventTarget = e && e.target
  const active = typeof document !== 'undefined' ? document.activeElement : null
  return isEditableNode(eventTarget) || isEditableNode(active)
}

function isEditableNode(node) {
  if (!node) return false
  if (typeof document !== 'undefined' && (node === document.body || node === document.documentElement)) return false
  const tag = node.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (node.isContentEditable === true) return true
  return Boolean(node.closest?.('input, textarea, select, [contenteditable="true"], .chat-panel, .chat-input-row'))
}
