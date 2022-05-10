import { BlockColor as BaseBlockColor } from "../types/Base";

export type BlockColor = BaseBlockColor;

interface BlockColorConstDefinition {
    GRAY: BlockColor;
    RED: BlockColor;
    BLUE: BlockColor;
}

export const BlockColorConst: BlockColorConstDefinition = {
    GRAY: "gray",
    RED: "red",
    BLUE: "blue",
};
