import type { InspectOptions, inspect } from 'node:util'

const utilInspectSymbol = Symbol.for('nodejs.util.inspect.custom')

export function renameClass<
  TClass extends new (
    ...args: any[]
  ) => any,
  const TName extends string,
>(cls: TClass, newName: TName): { [K in TName]: TClass } {
  Object.defineProperty(cls, 'name', { value: newName, configurable: true })
  ;(cls as any)[utilInspectSymbol] = (
    depth: number,
    options: InspectOptions,
    inspect: inspect,
  ) => {
    const header = options.stylize(`[class ${newName}]`, 'special')
    if (depth < 0) return header

    const inspectedProps = inspect(cls.prototype, {
      ...options,
      depth: options.depth === null ? null : options.depth - 1,
    })

    return inspectedProps === '{}' ? header : `${header} ${inspectedProps}`
  }

  Object.defineProperty(cls.prototype, Symbol.toStringTag, {
    value: newName,
    enumerable: false,
  })

  return { [newName]: cls } as { [K in TName]: TClass }
}
