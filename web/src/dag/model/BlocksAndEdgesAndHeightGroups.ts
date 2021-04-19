import {Block} from "./Block";
import {Edge} from "./Edge";
import {HeightGroup} from "./HeightGroup";

export type BlocksAndEdgesAndHeightGroups = {
    blocks: Block[],
    edges: Edge[],
    heightGroups: HeightGroup[],
}