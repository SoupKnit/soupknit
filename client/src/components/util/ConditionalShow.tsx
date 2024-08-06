/**
 * This component renders its children only if the condition is true.
 * Note: This component does NOT prevent the children from being evaluated.
 */
export function Show({
  when,
  children,
}: {
  when: boolean
  children: React.ReactNode
}) {
  return when ? children : null
}

export function Hide({
  when,
  children,
}: {
  when: boolean
  children: React.ReactNode
}) {
  return when ? null : children
}
