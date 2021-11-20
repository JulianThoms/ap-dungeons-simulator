import { Actor } from "./actor";
import { Event } from "./events";

export enum AuraKind {
    BIG_CLUB,
    POISON,
    SEEKING_MISSILES,
    CHICKEN_EXHAUSTION,
}

export type Aura = {
    kind: AuraKind,
    stacks: number
}