import { Step, StepMap as Map } from 'prosemirror-transform'
import uuid from 'uuid/v4'

export default class {
  public id: string
  public steps: Step[]
  public maps: Map[]
  public status: 'accepted' | 'rejected' | null

  constructor(steps: Step[], maps: Map[]) {
    this.id = uuid()
    this.steps = steps
    this.maps = maps
    this.status = null
  }

  reject() {
    return {
      ...this,
      status: 'rejected',
    }
  }
}
