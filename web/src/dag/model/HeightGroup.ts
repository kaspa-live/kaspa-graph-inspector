export type HeightGroup = {
    height: number,
    size: number,
};

export function areHeightGroupsEqual(left: HeightGroup, right: HeightGroup): boolean {
    return left.height === right.height
        && left.size === right.size;
}
