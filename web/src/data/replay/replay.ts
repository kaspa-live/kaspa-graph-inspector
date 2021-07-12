import {ReplayData} from "../ReplayDataSource";
import {test} from "./test";
import {test2} from "./test2";

export const replay: { [name: string]: ReplayData } = {
    "test": test,
    "test2": test2,
};
