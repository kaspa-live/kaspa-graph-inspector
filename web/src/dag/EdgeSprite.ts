import * as PIXI from "pixi.js";

export default class EdgeSprite extends PIXI.Sprite {
    private readonly application: PIXI.Application;

    constructor(application: PIXI.Application) {
        super();

        this.application = application;
    }
}