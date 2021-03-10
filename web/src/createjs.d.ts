declare module '@createjs/core' {
    export class Ticker {
        static get timingMode(): string
        static set timingMode(timingMode: string)

        static get RAF(): string
    }
}
