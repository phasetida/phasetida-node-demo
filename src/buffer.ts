function createBuffer(length: number): Uint8Array {
    let arrayBuffer = new ArrayBuffer(length);
    let buffer = new Uint8Array(arrayBuffer);
    return buffer;
}
export { createBuffer };
