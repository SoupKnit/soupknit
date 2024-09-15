import type { ClientEnvironment } from "@/lib/clientEnvironment"

// client actions are async functions that have the first parameter as Supabase client
// and the rest of the parameters depend on the action
export type ClientAction<Args extends any[], R> = (
  env: ClientEnvironment,
  ...args: Args
) => Promise<R>

export type ClientActionRegistry = Record<string, ClientAction<any, any>>

export type BoundActions<A> = {
  [K in keyof A]: A[K] extends (
    env: ClientEnvironment,
    ...args: infer P
  ) => infer R
    ? (...args: P) => R
    : never
}
export function withClientContext<A extends Record<string, any>>(
  actions: A,
  env: ClientEnvironment,
): BoundActions<A> {
  const boundActions = {} as BoundActions<A>

  for (const key in actions) {
    boundActions[key] = ((...args: any[]) => actions[key](env, ...args)) as any
  }

  return boundActions
}
