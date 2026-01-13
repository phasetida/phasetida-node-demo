import { pre_draw } from "phasetida-wasm-core";
import { AssetImage } from "./image";
import { writeTouches } from "./input";

class ViewPort {
    worldWidth: number;
    worldHeight: number;
    scale: number = 0.0;
    constructor(worldWidth: number, worldHeight: number) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }
    update(innerWidth: number, innerHeight: number) {
        this.scale = Math.min(
            innerWidth / this.worldWidth,
            innerHeight / this.worldHeight
        );
    }
    project(worldX: number, worldY: number): [number, number] {
        return [worldX * this.scale, worldY * this.scale];
    }
    unProject(canvasX: number, canvasY: number): [number, number] {
        return [canvasX / this.scale, canvasY / this.scale];
    }
    projectSize(worldSize: number): number {
        return worldSize * this.scale;
    }
}

class CursorDataView {
    dataView: DataView;
    cursor: number = 0;
    littleEndian: boolean;

    constructor(
        buffer: ArrayBufferLike,
        length: number,
        littleEndian: boolean
    ) {
        this.dataView = new DataView(buffer, 0, length);
        this.littleEndian = littleEndian;
    }

    getFloat32(): number {
        let r = this.dataView.getFloat32(this.cursor, this.littleEndian);
        this.cursor += 4;
        return r;
    }

    getUint8(): number {
        let r = this.dataView.getUint8(this.cursor);
        this.cursor += 1;
        return r;
    }

    getUint32(): number {
        let r = this.dataView.getUint32(this.cursor, this.littleEndian);
        this.cursor += 4;
        return r;
    }

    isFinished(): boolean {
        return this.dataView.byteLength <= this.cursor;
    }
}

function draw(
    inputBuffer: Uint8Array,
    outputBuffer: Uint8Array,
    imagesMap: Map<string, HTMLCanvasElement | AssetImage>
) {
    const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const viewPort = new ViewPort(1920.0, 1080.0);
    window._simStartTime = Date.now();
    window._simLastChangeSpeedTime = 0.0;
    window._simLastTimeInSecond = window._simStartTime / 1000.0;
    const timeRange = document.getElementById(
        "sim-playback-time"
    ) as HTMLInputElement;
    const timeDisplay = document.getElementById(
        "sim-playback-time-display"
    ) as HTMLLabelElement;
    function drawLoop() {
        const nowTime = Date.now();
        const currentTimeInSecond =
            window._simLastChangeSpeedTime / 1000.0 +
            ((nowTime - window._simStartTime) / 1000.0) * window._simSpeed;
        viewPort.update(window.innerWidth, window.innerHeight);
        const [clipW, clipH] = [
            viewPort.projectSize(1920.0),
            viewPort.projectSize(1080.0),
        ];
        canvas.width = clipW;
        canvas.height = clipH;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, clipW, clipH);
        ctx.lineWidth = viewPort.projectSize(10);
        pre_draw(
            /*time_in_second*/ currentTimeInSecond,
            /*delta_time_in_second*/ currentTimeInSecond -
                window._simLastTimeInSecond,
            /*auto*/ window.simAuto
        );
        drawBuffer(ctx, imagesMap, viewPort, outputBuffer);
        writeTouches(inputBuffer, viewPort);
        window._simLastTimeInSecond = currentTimeInSecond;
        timeRange.value = `${currentTimeInSecond * 1000.0}`;
        timeDisplay.innerHTML = `${parseFloat(timeRange.value) / 1000.0}`;
        requestAnimationFrame(drawLoop);
    }
    requestAnimationFrame(drawLoop);
}

function drawImage(
    images: Map<string, HTMLCanvasElement | AssetImage>,
    ctx: CanvasRenderingContext2D,
    name: string,
    x: number,
    y: number,
    scale: number,
    rotation: number,
    opacity: number | null,
    heightEnforce: number | null
) {
    const imgData = images.get(name);
    if (imgData === undefined) {
        console.warn(`Image "${name}" not loaded`);
        return;
    }
    let image;
    let width;
    let height;
    if ("image" in imgData) {
        image = imgData.image;
        width = imgData.width;
        height = imgData.height;
    } else {
        image = imgData;
        width = imgData.width;
        height = imgData.height;
    }
    const rad = (rotation * Math.PI) / 180;
    const drawWidth = width * scale;
    const drawHeight = heightEnforce === null ? height * scale : heightEnforce;
    const anchorOffset = { x: drawWidth / 2, y: drawHeight / 2 };
    ctx.save();
    ctx.globalAlpha = opacity ?? 1.0;
    ctx.translate(x, y);
    if (rotation !== 0) {
        ctx.rotate(rad);
    }
    ctx.drawImage(
        image,
        -anchorOffset.x,
        -anchorOffset.y,
        drawWidth,
        drawHeight
    );
    ctx.restore();
}

function drawBuffer(
    ctx: CanvasRenderingContext2D,
    imagesMap: Map<string, HTMLCanvasElement | AssetImage>,
    viewPort: ViewPort,
    outputBuffer: Uint8Array
) {
    const outputView = new CursorDataView(
        outputBuffer.buffer,
        outputBuffer.length,
        true
    );
    while (!outputView.isFinished()) {
        const type = outputView.getUint8();
        if (type == 0) {
            break;
        }
        switch (type) {
            case 1: {
                const x1 = outputView.getFloat32();
                const y1 = outputView.getFloat32();
                const x2 = outputView.getFloat32();
                const y2 = outputView.getFloat32();
                const alpha = outputView.getFloat32();
                ctx.strokeStyle = `rgba(255, 254, 183, ${alpha})`;
                ctx.beginPath();
                const [x1p, y1p] = viewPort.project(x1, y1);
                const [x2p, y2p] = viewPort.project(x2, y2);
                ctx.moveTo(x1p, y1p);
                ctx.lineTo(x2p, y2p);
                ctx.stroke();
                break;
            }
            case 2: {
                const noteType = outputView.getUint8();
                const x = outputView.getFloat32();
                const y = outputView.getFloat32();
                const rotate = outputView.getFloat32();
                const height = outputView.getFloat32();
                const highLight = outputView.getUint8();
                const [xp, yp] = viewPort.project(x, y);
                let name = "tap";
                let heightEnforce = null;
                switch (noteType) {
                    case 1:
                        name =
                            highLight != 0 && window.simSimultaneousHighlight
                                ? "tap_hl"
                                : "tap";
                        break;
                    case 2:
                        name =
                            highLight != 0 && window.simSimultaneousHighlight
                                ? "drag_hl"
                                : "drag";
                        break;
                    case 4:
                        name =
                            highLight != 0 && window.simSimultaneousHighlight
                                ? "flick_hl"
                                : "flick";
                        break;
                    case 5:
                        name =
                            highLight != 0 && window.simSimultaneousHighlight
                                ? "hold_head_hl"
                                : "hold_head";
                        break;
                    case 6:
                        name =
                            highLight != 0 && window.simSimultaneousHighlight
                                ? "hold_body_hl"
                                : "hold_body";
                        heightEnforce = viewPort.projectSize(height);
                        break;
                    case 7:
                        name = "hold_end";
                        break;
                }
                drawImage(
                    imagesMap,
                    ctx,
                    name,
                    xp,
                    yp,
                    viewPort.projectSize(0.25),
                    rotate,
                    null,
                    heightEnforce
                );
                break;
            }
            case 3: {
                const x = outputView.getFloat32();
                const y = outputView.getFloat32();
                const frame = outputView.getUint8();
                const tintType = outputView.getUint8();
                const [xp, yp] = viewPort.project(x, y);
                if (tintType == 0) {
                    drawImage(
                        imagesMap,
                        ctx,
                        "effect_perfect_" + frame,
                        xp,
                        yp,
                        viewPort.projectSize(1.5),
                        0.0,
                        null,
                        null
                    );
                } else if (tintType == 1) {
                    drawImage(
                        imagesMap,
                        ctx,
                        "effect_good_" + frame,
                        xp,
                        yp,
                        viewPort.projectSize(1.5),
                        0.0,
                        null,
                        null
                    );
                }
                break;
            }
            case 4: {
                outputView.getFloat32();
                outputView.getFloat32();
                break;
            }
            case 5: {
                const hint = document.getElementById("hint")!;
                const combo = outputView.getUint32();
                const maxCombo = outputView.getUint32();
                const score = outputView.getFloat32();
                const accurate = outputView.getFloat32();
                hint.innerHTML = `combo: ${combo}<br>max combo: ${maxCombo}<br>score: ${score}<br>accurate: ${accurate}`;
            }
        }
    }
}

export { draw };
export type { ViewPort };
