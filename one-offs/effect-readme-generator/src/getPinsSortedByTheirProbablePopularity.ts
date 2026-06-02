import type { IRepo } from './repo.interface.ts'

export function getPinsSortedByTheirProbablePopularity(
  fetchedReposWithPins: {
    repo: IRepo
    pin: string
  }[],
) {
  const getAggregatedParameter = (
    aggregationType: 'min' | 'max',
    parameter: 'star' | 'fork',
  ) =>
    Math[aggregationType](
      ...fetchedReposWithPins.map(_ => _.repo[`${parameter}Count`]),
    )

  const maxStars = getAggregatedParameter('max', 'star')
  const minStars = getAggregatedParameter('min', 'star')
  const maxForks = getAggregatedParameter('max', 'fork')
  const minForks = getAggregatedParameter('min', 'fork')

  return fetchedReposWithPins
    .map(({ repo, pin }) => {
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
    .sort((a, b) => {
      // `extends infer K` needed to activate type distribution
      type Factor = keyof typeof a extends infer K
        ? K extends `${infer U}Factor`
          ? U
          : never
        : never
      const smallestFirst = (f: Factor) => a[`${f}Factor`] - b[`${f}Factor`]
      const biggestFirst = (f: Factor) => -smallestFirst(f)
      let _: number

      if ((_ = biggestFirst('effect'))) return _
      if ((_ = biggestFirst('template'))) return _
      if ((_ = biggestFirst('boilerplate'))) return _
      if ((_ = smallestFirst('archive'))) return _
      if ((_ = smallestFirst('hackathon'))) return _
      if ((_ = smallestFirst('experiment'))) return _
      if ((_ = biggestFirst('publicityClass'))) return _
      if ((_ = biggestFirst('pushRecency'))) return _ // if null goes to bottom

      return 0
    })
    .map(_ => _.pin)
}
