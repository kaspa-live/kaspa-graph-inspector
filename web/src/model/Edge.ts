export type Edge = {
    fromBlockId: number,
    toBlockId: number,
    fromHeight: number,
    toHeight: number,
    fromHeightGroupIndex: number,
    toHeightGroupIndex: number,
}

export function areEdgesEqual(left: Edge, right: Edge): boolean {
    return left.fromBlockId === right.fromBlockId
        && left.toBlockId === right.toBlockId
        && left.fromHeight === right.fromHeight
        && left.toHeight === right.toHeight
        && left.fromHeightGroupIndex === right.fromHeightGroupIndex
        && left.toHeightGroupIndex === right.toHeightGroupIndex;
}
