import * as Data from 'effect/Data'

import type { ButtonState } from '../branded/index.ts'
import type { Accord } from '../services/AccordRegistry.ts'
import type { Pattern } from '../services/PatternRegistry.ts'

export class PhysicalButtonModel extends Data.Class<{
  buttonPressState: ButtonState.NotPressed | ButtonState.Pressed
  assignedTo?: Accord | Pattern
}> {
  constructor(
    buttonPressState: ButtonState.NotPressed | ButtonState.Pressed,
    assignedTo?: Accord | Pattern,
  ) {
    super({ buttonPressState, ...(assignedTo && { assignedTo }) })
  }
}
