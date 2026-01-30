import * as EFunction from 'effect/Function'
import * as Option from 'effect/Option'
import * as SortedMap from 'effect/SortedMap'

export const sortedMapModifyAt = EFunction.dual<
  <K, V>(
    key: K,
    f: (option: Option.Option<V>) => Option.Option<V>,
  ) => (self: SortedMap.SortedMap<K, V>) => SortedMap.SortedMap<K, V>,
  <K, V>(
    self: SortedMap.SortedMap<K, V>,
    key: K,
    f: (option: Option.Option<V>) => Option.Option<V>,
  ) => SortedMap.SortedMap<K, V>
>(3, (self, key, f) => {
  const value = f(SortedMap.get(self, key))
  return Option.match(value, {
    onNone: () => SortedMap.remove(self, key),
    onSome: v => SortedMap.set(self, key, v),
  })
})

export const sortedMapModify = EFunction.dual<
  <K, V>(
    key: K,
    f: (v: V) => V,
  ) => (self: SortedMap.SortedMap<K, V>) => SortedMap.SortedMap<K, V>,
  <K, V>(
    self: SortedMap.SortedMap<K, V>,
    key: K,
    f: (v: V) => V,
  ) => SortedMap.SortedMap<K, V>
>(3, (self, key, f) => sortedMapModifyAt(self, key, Option.map(f)))
