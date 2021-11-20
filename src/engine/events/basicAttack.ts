import { getRandomInt } from "../../util/math";
import { Actor } from "../actor";
import { AuraKind } from "../aura";
import { CombatEvent, Event, EventKind, ProcessedEventResult } from "../events";
import * as _ from 'lodash'
import { TargetFinalizedEvent } from "./targetFinalized";
import { DamageDealtEvent } from "./damageDealt";
import { AfterAttackEvent } from "./afterAttack";
import { combatMessage } from "../../log";

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

        let resultEvents: Event[] = []

        // Note: For now, we can assume this won't kill anything that might otherwise already be targeted
        // That may eventually not be true
        // Now it is not true anymore
        // pog
        // fucking kill me
        // whirlwind axe can kill something before basic attack happens
        // which can't kill the thing being targeted
        // but can move it around by killing the thing before it
        // so now we make a BASIC_ATTACK_ITEM event
        // process all that garbage
        // then do this
        // damage needs to be calculated in BASIC_ATTACK_ITEM
        // then we just run the rest of the logic in here after
        // oof
        // oh NO
        // we already have a finalized target before basic attack item
        // but things can *still die* 
        // so we need to target the thing we were targeting all along
        // because that can't be dead
        // we just have to figure out wtf its index is
        // so we either need to leave dead things in the array
        // or find a better way to reference

        for (let i = 0; i < attacker.items.length; i++) {
            const itemResult = attacker.items[i].handleOnBasicAttack(newPartyStates, baseDamageDealt, this)
            newPartyStates = itemResult.newPartyStates
            resultEvents = resultEvents.concat(itemResult.newEvents)
        }

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

        const damageDealtEvent = new DamageDealtEvent(totalDamage, this.defenderPartyIndex, this.defenderIndex, this)
    
        resultEvents.unshift(damageDealtEvent)
        resultEvents.unshift(new AfterAttackEvent(this))

        // something to consider is that the indices change when something is killed / removed from the array
        // so if whirlwind axe kills the thing before our target in the party
        // the target could get switched because the indices are different
    
        combatMessage(`${
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