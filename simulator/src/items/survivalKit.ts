import { Actor } from "../engine/actor"
import { CombatEvent, Event, EventKind, ProcessedEventResult } from "../engine/events"
import { Item } from "../engine/item"
import { ItemKind } from "../engine/itemTypes"
import { getRandomInt } from "../util/math"
import cloneDeep from 'lodash/cloneDeep'
import { SelectTargetEvent } from "../engine/events/selectTarget"

import { DungeonContext } from "../simulator"

export class SurvivalKit extends Item {
    constructor(tier: number) {
        let kind = ItemKind.SURVIVAL_KIT
        let name = ItemKind[ItemKind.SURVIVAL_KIT]
        let energyCost = 0
        super(kind, name, tier, energyCost)
    }

    handleOnDungeonStart(ctx: DungeonContext, parties: Actor[][], ownerPartyIndex: number, ownerIndex: number): ProcessedEventResult {
        let newPartyStates = cloneDeep(parties)
        let owner = newPartyStates[ownerPartyIndex][ownerIndex]

        owner.curHP += 20 * this.tier
        owner.maxHP += 20 * this.tier

        newPartyStates[ownerPartyIndex][ownerIndex] = owner

        return {
            newPartyStates,
            newEvents: []
        }
    }

    handleBeforeDefenderTargetFinalized(ctx: DungeonContext, parties: Actor[][], itemHolderIndex: number, event: SelectTargetEvent): SelectTargetEvent {
        if (itemHolderIndex === event.defenderIndex) {
            return null
        }

        let chance = 10 + this.tier * 3
        let roll = getRandomInt(0, 100)
        if (roll < chance) {
            let attacker = parties[event.attackerPartyIndex][event.attackerIndex]
            let originalDefender = parties[event.defenderPartyIndex][event.defenderIndex]
            let newDefender = parties[event.defenderPartyIndex][itemHolderIndex]

            if (newDefender.curHP < originalDefender.curHP) {
                ctx.logCombatMessage(`${newDefender.name} thinks about jumping in front of the attack, but is a coward.`)

                return new SelectTargetEvent(
                    event.attackerPartyIndex,
                    event.attackerIndex,
                    event.defenderIndex,
                )
            }

            ctx.logCombatMessage(`${attacker.name} targets ${originalDefender.name} but ${
                newDefender.name} jumps in front of the attack and saves them.`)

            return new SelectTargetEvent(
                event.attackerPartyIndex,
                event.attackerIndex,
                itemHolderIndex,
            )
        }

        return null
    }
}