import {ReplayData} from "../ReplayDataSource";
import {test} from "./test";
import {ghostdag5bps} from "./ghostdag5bps";

export const replayDataGenerators: { [name: string]: () => ReplayData } = {
    "test": test,
    "ghostdag5bps": ghostdag5bps,
};
