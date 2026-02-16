import * as EFunction from 'effect/Function'
import * as HashMap from 'effect/HashMap'
import * as Option from 'effect/Option'

export const HashMapModifyAt = EFunction.dual<
  <K, V>(
    key: K,
    f: (option: Option.Option<V>) => Option.Option<V>,
  ) => (self: HashMap.HashMap<K, V>) => HashMap.HashMap<K, V>,
  <K, V>(
    self: HashMap.HashMap<K, V>,
    key: K,
    f: (option: Option.Option<V>) => Option.Option<V>,
  ) => HashMap.HashMap<K, V>
>(3, (self, key, f) => {
  const foundValue = HashMap.get(self, key)
  const transformedValue = f(foundValue)

  if (Option.isSome(transformedValue))
    return HashMap.set(self, key, transformedValue.value)

  if (Option.isNone(foundValue)) return self

  return HashMap.remove(self, key)
})

export const HashMapModify = EFunction.dual<
  <K, V>(
    key: K,
    f: (v: V) => V,
  ) => (self: HashMap.HashMap<K, V>) => HashMap.HashMap<K, V>,
  <K, V>(
    self: HashMap.HashMap<K, V>,
    key: K,
    f: (v: V) => V,
  ) => HashMap.HashMap<K, V>
>(3, (self, key, f) => HashMapModifyAt(self, key, Option.map(f)))
