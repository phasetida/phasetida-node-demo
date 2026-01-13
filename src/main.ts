import { createBuffer } from "./buffer";
import { draw } from "./draw";
import { loadImage, tintToTempCanvas, type AssetImage } from "./image";
import { load_level, reset_note_state } from "phasetida-wasm-core";
import { registerListener } from "./input";
import { registerControllers, setSongLength } from "./control";
declare global {
    interface Window {
        inputBuffer: Uint8Array;
        outputBuffer: Uint8Array;
        outputBufferLength: number;
        inputBufferLength: number;
        simAuto: boolean;
        simSimultaneousHighlight: boolean;
        simEnableTouch: boolean;
        simSetTime: (timeInSecond: number) => void;
        simSetSpeed: (speed: number) => void;
        simSetShowControls: (show: boolean) => void;
        simLoadLevel: (json: string) => void;
        _simPlaying: boolean;
        _simPlayLock: boolean;
        _simStartTime: number;
        _simLastChangeSpeedTime: number;
        _simLastTimeInSecond: number;
        _simSpeed: number;
    }
}
(async () => {
    console.info("phasetida-node");
    const inputBufferLength = 1024;
    const outputBufferLength = 65536;
    console.info(
        `initializing buffers, input:${inputBufferLength}, output:${outputBufferLength}`
    );
    window.simAuto = true;
    window.simSimultaneousHighlight = true;
    window.simEnableTouch = false;
    window.inputBuffer = createBuffer(inputBufferLength);
    window.outputBuffer = createBuffer(outputBufferLength);
    window.inputBufferLength = inputBufferLength;
    window.outputBufferLength = outputBufferLength;
    window._simSpeed = 1.0;
    window._simPlaying = false;
    window._simPlayLock = false;
    window.simSetSpeed = (speed: number) => {
        window._simLastChangeSpeedTime +=
            (Date.now() - window._simStartTime) * window._simSpeed;
        window._simStartTime = Date.now();
        window._simSpeed = speed;
    };
    window.simSetTime = (time: number) => {
        window._simLastChangeSpeedTime = 0.0;
        window._simStartTime = Date.now() - (time * 1000.0) / window._simSpeed;
        window._simLastTimeInSecond = 0.0;
        reset_note_state(time);
    };
    window.simSetShowControls = (show: boolean) => {
        (document.getElementById("debug-container") as HTMLDivElement).hidden =
            !show;
    };
    window.simLoadLevel = (json: string) => {
        const useDefaultButton = document.getElementById(
            "sim-use-default-level"
        ) as HTMLButtonElement;
        useDefaultButton.hidden = true;
        window._simPlaying = false;
        console.info("initializing level");
        const loadResult = load_level(json);
        console.info(`level load result: ${loadResult}`);
        console.info(`song length: ${loadResult.length_in_second}`);
        setSongLength(loadResult.length_in_second);
        window._simLastTimeInSecond = 0.0;
        window._simLastChangeSpeedTime = 0.0;
        window._simPlaying = true;
        draw(window.inputBuffer, window.outputBuffer, images);
    };
    registerControllers();
    console.info("loading assets");
    const images = new Map<string, HTMLCanvasElement | AssetImage>();
    const hintLabel = document.getElementById("hint") as HTMLLabelElement;
    async function _loadImage(name: string, image: string): Promise<void> {
        hintLabel.innerHTML = `loading ${image}->${name}`;
        images.set(name, await loadImage(image));
    }
    await _loadImage("tap", "./note/tap.png");
    await _loadImage("drag", "./note/drag.png");
    await _loadImage("flick", "./note/flick.png");
    await _loadImage("hold_head", "./note/hold_head.png");
    await _loadImage("hold_body", "./note/hold_body.png");
    await _loadImage("hold_end", "./note/hold_end.png");
    await _loadImage("tap_hl", "./note/tap_hl.png");
    await _loadImage("drag_hl", "./note/drag_hl.png");
    await _loadImage("flick_hl", "./note/flick_hl.png");
    await _loadImage("hold_head_hl", "./note/hold_head_hl.png");
    await _loadImage("hold_body_hl", "./note/hold_body_hl.png");
    await _loadImage("hold_body_hl", "./note/hold_body_hl.png");
    for (let i = 0; i <= 29; i++) {
        await _loadImage("click_" + i, "./click/click" + i + ".png");
        let origin = images.get("click_" + i) as AssetImage;
        images.set(
            "effect_perfect_" + i,
            tintToTempCanvas(origin, "rgba(255, 254, 183, 255)")
        );
        images.set(
            "effect_good_" + i,
            tintToTempCanvas(origin, "rgba(168, 239, 246, 255)")
        );
    }
    console.info("initializing canvas");
    registerListener();
    console.info("waiting for level... (use 'window.')");
    hintLabel.innerHTML = `waiting for level...`;
    const useDefaultButton = document.getElementById(
        "sim-use-default-level"
    ) as HTMLButtonElement;
    useDefaultButton.hidden = false;
    useDefaultButton.onclick = async (_) => {
        hintLabel.innerHTML = `loading default level...`;
        const json = await (await fetch("./test.json")).text();
        window.simLoadLevel(json);
    };
})();
