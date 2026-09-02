// true when a keyboard event is happening inside a text field (chat box, name
// input, etc). global game/park key handlers use this to stay out of the way so
// typing a message never also drives the game or gets swallowed.
export function isTypingInField(e) {
  const t = e && e.target
  if (!t) return false
  const tag = t.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable === true
}
