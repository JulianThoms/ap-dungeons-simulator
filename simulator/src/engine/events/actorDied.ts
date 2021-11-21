import { Actor } from "../actor"
import { CombatEvent, Event, EventKind, ProcessedEventResult } from "../events"
import * as _ from 'lodash'
import { DamageTakenEvent } from "./damageTaken"

class ActorDiedEvent extends Event {
    actor: Actor
    triggeredBy: DamageTakenEvent

    constructor(actor: Actor, triggeredBy: DamageTakenEvent) {
        super(EventKind.ACTOR_DIED)
        this.actor = actor
        this.triggeredBy = triggeredBy
    }

    processActorDied(partyStates: Actor[][]): ProcessedEventResult {
        let newPartyStates = _.cloneDeep(partyStates)
        let actorDiedEvents: Event[] = []
    
        for (let i = 0; i < this.actor.items.length; i++) {
            let result = this.actor.items[i].handleOnDeath(newPartyStates, this.triggeredBy)
            newPartyStates = result.newPartyStates
            actorDiedEvents = actorDiedEvents.concat(result.newEvents)
        }

        return {
            newPartyStates,
            newEvents: actorDiedEvents
        }
    }
}

export {
    ActorDiedEvent
}