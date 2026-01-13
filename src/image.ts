class AssetImage {
    image: HTMLImageElement;
    width: number;
    height: number;

    constructor(image: HTMLImageElement, width: number, height: number) {
        this.image = image;
        this.width = width;
        this.height = height;
    }
}

async function loadImage(url: string): Promise<AssetImage> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const blob = new Blob([byteArray], { type: contentType });
    const imageUrl = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((resolve, reject) => {
        img.onload = () => {
            URL.revokeObjectURL(imageUrl);
            resolve(img);
        };
        img.onerror = reject;
        img.src = imageUrl;
    });
    return {
        image: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
    };
}

function tintToTempCanvas(
    img: AssetImage,
    tintColor: string
): HTMLCanvasElement {
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx == null) {
        throw Error("failed to create context");
    }
    const { image, width, height } = img;
    tempCtx.drawImage(image, 0, 0);
    tempCtx.globalCompositeOperation = "source-in";
    tempCtx.fillStyle = tintColor;
    tempCtx.fillRect(0, 0, width, height);
    tempCtx.globalCompositeOperation = "source-over";
    return tempCanvas;
}

export { loadImage, tintToTempCanvas,AssetImage };
