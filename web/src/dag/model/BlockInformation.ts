import {Block} from "./Block";

export type BlockInformation = {
    block: Block,
    parentHashes: string[],
    selectedParentHash: string | null,
    mergeSetRedHashes: string[],
    mergeSetBlueHashes: string[],

    isInformationComplete: boolean,
};