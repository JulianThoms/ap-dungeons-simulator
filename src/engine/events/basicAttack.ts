import { getRandomInt } from "../../util/math";
import { Actor } from "../actor";
import { AuraKind } from "../aura";
import { CombatEvent, Event, EventData, EventKind, ProcessedEventResult } from "../events";
import * as _ from 'lodash'
import { TargetFinalizedEvent } from "./targetFinalized";
import { DamageTakenEvent } from "./damageTaken";
import { AfterAttackEvent } from "./afterAttack";

class BasicAttackEvent extends CombatEvent {
    triggeredBy: TargetFinalizedEvent

    constructor(triggeredBy: TargetFinalizedEvent) {
        super(EventKind.BASIC_ATTACK, triggeredBy)
        this.triggeredBy = triggeredBy
    }

    processBasicAttack(parties: Actor[][]): ProcessedEventResult {
        // resubmit the basic attack event if we are targeting something that died
        const attacker = parties[this.attackerPartyIndex][this.attackerIndex]
        const defender = parties[this.defenderPartyIndex][this.defenderIndex]
        if (defender === undefined) {
            const defenderIndex = getRandomInt(0, parties[this.defenderPartyIndex].length)
            this.triggeredBy.defenderIndex = defenderIndex
            return {
                newPartyStates: parties,
                newEvents: [new BasicAttackEvent(this.triggeredBy)]
            }
        }
    
        let newPartyStates = _.cloneDeep(parties) as Actor[][]
        
        const baseDamageDealt = getRandomInt(attacker.attackMin, attacker.attackMax + 1)
        let totalDamage = baseDamageDealt
        
        let resultEvents: Event[] = [new AfterAttackEvent(this)]

        // TODO: Refactor this behavior into the item
        if (attacker.auras.some(it => it.kind === AuraKind.SEEKING_MISSILES)) {
            totalDamage += attacker.auras.find(it => it.kind === AuraKind.SEEKING_MISSILES).stacks

            attacker.auras = attacker.auras.filter(aura => aura.kind !== AuraKind.SEEKING_MISSILES)
            newPartyStates[this.attackerPartyIndex][this.attackerIndex] = attacker
        }

        // TODO: Refactor this behavior into the item
        if (attacker.auras.some(it => it.kind === AuraKind.BIG_CLUB)) {
            totalDamage *= 2.5
            totalDamage = Math.floor(totalDamage)
            
            attacker.auras = attacker.auras.filter(aura => aura.kind !== AuraKind.BIG_CLUB)
            newPartyStates[this.attackerPartyIndex][this.attackerIndex] = attacker
        }

        const damageTakenEvent = new DamageTakenEvent(totalDamage, this.defenderPartyIndex, this.defenderIndex, this)
    
        resultEvents.push(damageTakenEvent)
    
        console.log(`${
            newPartyStates[this.attackerPartyIndex][this.attackerIndex].name
        } attacks ${
            newPartyStates[this.defenderPartyIndex][this.defenderIndex].name
        } for ${totalDamage} damage.`)
    
        return {
            newEvents: resultEvents,
            newPartyStates: newPartyStates
        }
    }
}

export {
    BasicAttackEvent
}