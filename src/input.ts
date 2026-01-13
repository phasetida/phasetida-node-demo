import { ViewPort } from "./draw";

type TouchPoint = {
    touchId: number;
    x: number;
    y: number;
    active: boolean;
};

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

    setFloat32(value: number) {
        this.dataView.setFloat32(this.cursor, value, this.littleEndian);
        this.cursor += 4;
    }

    setUint8(value: number) {
        this.dataView.setUint8(this.cursor, value);
        this.cursor += 1;
    }

    isFinished(): boolean {
        return this.dataView.byteLength <= this.cursor;
    }
}

let inputPoints = new Map<number, TouchPoint>();

function registerListener() {
    const canvas=document.getElementById("canvas") as HTMLCanvasElement;
    canvas.addEventListener("touchstart", (e) => {
        for (const touch of e.changedTouches) {
            inputPoints.set(touch.identifier, {
                touchId: touch.identifier,
                x: touch.clientX,
                y: touch.clientY,
                active: true,
            });
        }
        e.preventDefault();
    });
    canvas.addEventListener("touchmove", (e) => {
        for (const touch of e.changedTouches) {
            if (inputPoints.has(touch.identifier)) {
                inputPoints.set(touch.identifier, {
                    touchId: touch.identifier,
                    x: touch.clientX,
                    y: touch.clientY,
                    active: true,
                });
            }
        }
        e.preventDefault();
    });
    canvas.addEventListener("touchend", (e) => {
        for (const touch of e.changedTouches) {
            inputPoints.set(touch.identifier, {
                touchId: touch.identifier,
                x: touch.clientX,
                y: touch.clientY,
                active: false,
            });
        }
        e.preventDefault();
    });
    canvas.addEventListener("touchcancel", (e) => {
        for (const touch of e.changedTouches) {
            inputPoints.delete(touch.identifier);
        }
        e.preventDefault();
    });
}

function writeTouches(inputBuffer: Uint8Array, viewPort: ViewPort) {
    const dataView = new CursorDataView(
        inputBuffer.buffer,
        inputBuffer.length,
        true
    );
    if (window.simEnableTouch) {
        inputPoints.forEach((touch) => {
            if (touch === null || touch === undefined || !touch.active) {
                return;
            }
            const [x, y] = viewPort.unProject(touch.x, touch.y);
            dataView.setUint8(1);
            dataView.setUint8(touch.touchId);
            dataView.setFloat32(x);
            dataView.setFloat32(y);
        });
    }
    dataView.setUint8(0);
}

export { writeTouches, registerListener };
