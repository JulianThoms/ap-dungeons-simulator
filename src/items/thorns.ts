import { Actor } from "../engine/actor"
import { CombatEvent, Event, EventKind, ProcessedEventResult } from "../engine/events"
import { DamageDealtEvent } from "../engine/events/damageDealt"
import { StartTurnEvent } from "../engine/events/startTurn"
import { Item } from "../engine/item"
import { ItemKind } from "../engine/itemTypes"
import { getRandomInt } from "../util/math"
import * as _ from 'lodash'
import { combatMessage } from "../log"

export class Thorns extends Item {
    constructor(tier: number) {
        let kind = ItemKind.THORNS
        let name = ItemKind[ItemKind.THORNS]
        let energyCost = 0
        super(kind, name, tier, energyCost)
    }

    handleOnTurnStart(parties: Actor[][], event: StartTurnEvent): ProcessedEventResult {
        let newPartyStates = _.cloneDeep(parties)
        const defenderPartyIndex = event.turnActorPartyIndex === 0 ? 1 : 0
        let thornsEvents: Event[] = []
        
        const attacker = newPartyStates[event.turnActorPartyIndex][event.turnActorIndex]
        const thornsDamage = 1 * this.tier

        combatMessage(`${attacker.name} unleashes a bunch of wild thorns!`)

        let energyGained = 0
        let energyGainTriggered = false
        for (let i = 0; i < newPartyStates[defenderPartyIndex].length; i++) {
            const damageDealtEvent = new DamageDealtEvent(thornsDamage, defenderPartyIndex, i, new CombatEvent(
                EventKind.GENERIC_COMBAT,
                event.turnActorPartyIndex,
                event.turnActorIndex,
                defenderPartyIndex,
                i
            ))

            thornsEvents = thornsEvents.concat(damageDealtEvent)

            combatMessage(`Ouch! ${newPartyStates[defenderPartyIndex][i].name} takes ${thornsDamage} damage from ${attacker.name}'s thorns.`)

            const roll = getRandomInt(0, 100)
            if (roll < 25 && energyGained === 0) {
                energyGained = 1 * this.tier
                attacker.energy += energyGained
                energyGainTriggered = true
                newPartyStates[event.turnActorPartyIndex][event.turnActorIndex] = attacker
            }
        }

        if (energyGainTriggered) {
            combatMessage(`${attacker.name}'s thorns gives them ${energyGained} energy.`)
        }
        
        return {
            newPartyStates,
            newEvents: thornsEvents
        }
    }
}