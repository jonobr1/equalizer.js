declare module "underscore" {
    export function clamp(v: any, a: any, b: any): number;
    export function defaults(base: any, ...args: any[]): any;
    export function extend(base: any, ...args: any[]): any;
    export function mod(v: any, l: any): number;
}
declare module "sound" {
    export class Sound {
        static has: any;
        constructor(context: any, uri: any, callback: any);
        playing: boolean;
        filter: any;
        buffer: any;
        data: any;
        gain: any;
        src: any;
        ctx: any;
        applyFilter(node: any): Sound;
        play(options: any): Sound;
        source: any;
        pause(options: any): Sound;
        stop(options: any): Sound;
        set volume(arg: number);
        get volume(): number;
        set speed(arg: number);
        get speed(): number;
        set currentTime(arg: number);
        get currentTime(): number;
        get millis(): number;
        get duration(): any;
    }
}
declare module "renderer" {
    export class Point {
        constructor(x: any, y: any);
        x: number;
        y: number;
        value: number;
        sum: number;
    }
    export class Renderer {
        constructor(width: any, height: any);
        domElement: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        children: any[];
        get width(): number;
        get height(): number;
        add(...args: any[]): Renderer;
        remove(...args: any[]): Renderer;
        appendTo(elem: any): Renderer;
        clear(): Renderer;
        render(): Renderer;
    }
    export class Shape {
        fill: string;
        linewidth: number;
        stroke: string;
        opacity: number;
        updated: boolean;
        position: Point;
        scale: number;
        noStroke(): Shape;
        noFill(): Shape;
        render(ctx: any): void;
    }
    export class Line extends Shape {
        constructor(x1: any, y1: any, x2: any, y2: any);
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        value: number;
    }
    export class Circle extends Shape {
        constructor(x: any, y: any, r: any);
        x: number;
        y: number;
        r: number;
    }
    export class Polyline extends Shape {
        constructor(vertices: any);
        vertices: any;
        index: number;
    }
}
declare module "styles" {
    export namespace styles {
        namespace font {
            const family: string;
            const size: number;
            const fill: string;
            const leading: number;
            const weight: number;
        }
        namespace classic {
            const display: string;
            const position: string;
            const background: string;
            const padding: string;
        }
        namespace recording {
            const position_1: string;
            export { position_1 as position };
            export const borderRadius: string;
            export const top: string;
            export const left: string;
            export const width: string;
            export const height: string;
            export const marginLeft: string;
            export const marginTop: string;
            export const cursor: string;
            const background_1: string;
            export { background_1 as background };
            export const content: string;
        }
    }
    export var colors: {
        eee: string;
        ccc: string;
        bbb: string;
        '888': string;
        black: string;
        green: string;
        blue: string;
        purple: string;
        pink: string;
        red: string;
        orange: string;
        gold: string;
        white: string;
    };
}
declare module "equalizer" {
    export class Equalizer {
        static Precision: number;
        static FrameRate: number;
        static Resolution: number;
        static Drag: number;
        static Drift: number;
        static Amplitude: number;
        static Threshold: number;
        static Sound: typeof Sound;
        constructor(context: any, width: any, height: any, fftSize: any);
        analysed: any;
        analyser: any;
        domElement: HTMLDivElement;
        nodes: any[];
        renderer: Renderer;
        bands: Line[];
        average: Polyline;
        ctx: any;
        appendTo(elem: any): Equalizer;
        load(path: any, callback: any): Promise<any>;
        add(node: any): Equalizer;
        remove(node: any): any[];
        update(currentTime: any, silent: any): Equalizer;
        reset(): Equalizer;
        set analyzer(arg: any);
        get analyzer(): any;
        set analyzed(arg: any);
        get analyzed(): any;
    }
    import { Renderer } from "renderer";
    import { Line } from "renderer";
    import { Polyline } from "renderer";
    import { Sound } from "sound";
}
