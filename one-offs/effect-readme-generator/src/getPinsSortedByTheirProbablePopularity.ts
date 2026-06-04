import * as Order from 'effect/Order'
import * as Struct from 'effect/Struct'

import type { Repo } from './repo.interface.ts'

export function getPinsSortedByTheirProbablePopularity(
  fetchedReposWithPins: { repo: Repo; pin: string }[],
) {
  const starCounts = fetchedReposWithPins.map(_ => _.repo.starCount)
  const forkCounts = fetchedReposWithPins.map(_ => _.repo.forkCount)

  const maxStars = Math.max(...starCounts)
  const minStars = Math.min(...starCounts)
  const maxForks = Math.max(...forkCounts)
  const minForks = Math.min(...forkCounts)

  return fetchedReposWithPins
    .map(({ repo, pin }): Scored => {
      const normalizedStarsFactor =
        (repo.starCount - minStars) / (maxStars - minStars)

      // I have too little forks, so that repo have either 0 or 1 forks, and it
      // affects coefficient too much, hence I added 0.25 to bring impact a
      // little down
      const normalizedForksFactorWithAdjustedValue =
        ((repo.forkCount - minForks) / (maxForks - minForks)) * 0.25

      const publicityFactor =
        normalizedStarsFactor + normalizedForksFactorWithAdjustedValue
      // publicityFactor: min=0, max=1.25
      // 6 popularity classes:
      // 0, 0 ... 0.25, 0.25 ... 0.5, 0.5 ... 0.75, 0.75 ... 0.1, 1 ... 1.25;

      // TODO: remove top 5% spikes to make factor a little fairer
      return {
        pin,
        templateFactor: +repo.isTemplate,
        boilerplateFactor: +repo.name.includes('boiler'),
        archiveFactor: +repo.isItArchived,
        effectFactor: +repo.name.includes('effect'),
        hackathonFactor: +repo.name.includes('hackathon'),
        experimentFactor: +repo.name.includes('experiment'),
        pushRecencyFactor: Number(repo.lastTimeBeenPushedInto),
        // 0 will get their separate class at the bottom
        publicityClassFactor: Math.ceil(publicityFactor / 0.25),
      }
    })
    .sort(PinOrder)
    .map(Struct.get('pin'))
}

const biggestFirst = (f: Factor) =>
  Order.mapInput(Order.reverse(Order.number), (a: Scored) => a[`${f}Factor`])

const smallestFirst = (f: Factor) =>
  Order.mapInput(Order.number, (a: Scored) => a[`${f}Factor`])

const PinOrder = Order.combineAll([
  biggestFirst('effect'),
  biggestFirst('template'),
  biggestFirst('boilerplate'),
  smallestFirst('archive'),
  smallestFirst('hackathon'),
  smallestFirst('experiment'),
  biggestFirst('publicityClass'),
  biggestFirst('pushRecency'), // if null goes to bottom
])

interface Scored {
  pin: string
  templateFactor: number
  boilerplateFactor: number
  archiveFactor: number
  effectFactor: number
  hackathonFactor: number
  experimentFactor: number
  pushRecencyFactor: number
  publicityClassFactor: number
}

type Factor<Key = keyof Scored> = Key extends `${infer U}Factor` ? U : never
