function registerControllers() {
    const autoPlayCheck = document.getElementById(
        "sim-auto-play"
    ) as HTMLInputElement;
    const enableInputCheck = document.getElementById(
        "sim-enable-input"
    ) as HTMLInputElement;
    const speedField = document.getElementById(
        "sim-playback-speed"
    ) as HTMLInputElement;
    const timeSetField = document.getElementById(
        "sim-playback-time-set"
    ) as HTMLInputElement;
    const speedFieldApply = document.getElementById(
        "sim-playback-speed-apply"
    ) as HTMLButtonElement;
    const timeSetFieldApply = document.getElementById(
        "sim-playback-time-set-apply"
    ) as HTMLButtonElement;
    autoPlayCheck.onchange = (_) => {
        window.simAuto = autoPlayCheck.checked;
        enableInputCheck.disabled = autoPlayCheck.checked;
        enableInputCheck.checked = false;
    };
    enableInputCheck.onchange = (_) => {
        window.simEnableTouch = enableInputCheck.checked;
    };
    const speedApply = function (key: string) {
        if (key == "Enter") {
            const i = parseFloat(speedField.value);
            if (Number.isNaN(i)) {
                return;
            }
            window.simSetSpeed(i);
        }
    };
    const timeSetApply = function (key: string) {
        if (key == "Enter") {
            const i = parseFloat(timeSetField.value);
            if (Number.isNaN(i)) {
                return;
            }
            window.simSetTime(i);
        }
    };
    speedField.onkeydown = (event: KeyboardEvent) => {
        const key = event.key;
        speedApply(key);
    };
    timeSetField.onkeydown = (event: KeyboardEvent) => {
        const key = event.key;
        timeSetApply(key);
    };
    speedFieldApply.onclick = (_) => {
        speedApply("Enter");
    };
    timeSetFieldApply.onclick = (_) => {
        timeSetApply("Enter");
    };
}

function setSongLength(length: number) {
    const timeRange = document.getElementById(
        "sim-playback-time"
    ) as HTMLInputElement;
    timeRange.min = "0";
    timeRange.max = `${length * 1000}`;
}

export { registerControllers, setSongLength };
