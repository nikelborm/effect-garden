import * as Schema from 'effect/Schema'

export class Silence extends Schema.TaggedClass<Silence>()('Silence', {}) {
  private declare '~brand~': never
  static {
    this.make = this.make.bind(this)
  }
}
