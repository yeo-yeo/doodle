import type { MouseEvent } from 'react';
import type { Pixel } from 'Canvas';
import { LENGTH } from 'Canvas';
import type { WebsocketMessageType } from 'WebsocketsContext';

export const onDrawStart = (
    e: MouseEvent,
    canvas: HTMLCanvasElement,
    setDrawing: (val: boolean) => void
) => {
    setDrawing(true);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    ctx.beginPath();
};

export const onDraw = ({
    e,
    canvas,
    drawing,
    colour,
    sendWSMessage,
    lastPixelChange,
}: {
    e: MouseEvent;
    canvas: HTMLCanvasElement;
    drawing: boolean;
    colour: string;
    sendWSMessage: (message: WebsocketMessageType) => void;
    lastPixelChange: React.MutableRefObject<Pixel | null>;
}) => {
    if (!drawing) {
        return;
    }
    // TODO: try and fill in gaps when mouse is continually held down but moved fast?
    fillPixel({ e, canvas, colour, sendWSMessage, lastPixelChange });
};

export const onClick = ({
    e,
    canvas,
    colour,
    sendWSMessage,
    lastPixelChange,
}: {
    e: MouseEvent;
    canvas: HTMLCanvasElement;
    colour: string;
    sendWSMessage: (message: WebsocketMessageType) => void;
    lastPixelChange: React.MutableRefObject<Pixel | null>;
}) => {
    fillPixel({ e, canvas, colour, sendWSMessage, lastPixelChange });
};

export const onDrawEnd = (
    canvas: HTMLCanvasElement,
    setDrawing: (val: boolean) => void
) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return;
    }
    ctx.closePath();
    setDrawing(false);
};

// TODO: this shouldn't overwrite borders
export const fillPixel = ({
    e,
    canvas,
    colour,
    sendWSMessage,
    lastPixelChange,
}: {
    e: MouseEvent;
    canvas: HTMLCanvasElement;
    colour: string;
    sendWSMessage: (message: WebsocketMessageType) => void;
    lastPixelChange: React.MutableRefObject<Pixel | null>;
}) => {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    const elPosition = canvas.getBoundingClientRect();

    const xPos = e.clientX - elPosition.x;
    const yPos = e.clientY - elPosition.y;

    const lowerX = Math.floor(xPos / 6) * 6;
    const lowerY = Math.floor(yPos / 6) * 6;

    ctx.beginPath();
    ctx.fillStyle = `#${colour}`;
    ctx.rect(lowerX, lowerY, 5, 5);
    ctx.fill();

    if (
        lowerX === lastPixelChange.current?.x &&
        lowerY === lastPixelChange.current?.y &&
        colour === lastPixelChange.current?.colour
    ) {
        return;
    }

    lastPixelChange.current = { x: lowerX, y: lowerY, colour };

    sendWSMessage({
        payload: { x: lowerX, y: lowerY, colour },
        type: 'pixelPainted',
    });
};

// todo - refactor/rename
// used to edit pixel because other user has painted it (i.e. triggered by ws message)
export const fillPixel2 = ({
    canvas,
    x,
    y,
    colour,
}: {
    canvas: HTMLCanvasElement | null;
    x: number;
    y: number;
    colour: string;
}) => {
    if (!canvas) {
        return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    ctx.beginPath();
    ctx.fillStyle = `#${colour}`;
    ctx.rect(x, y, 5, 5);
    ctx.fill();
};

const drawLine = (
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
) => {
    // TODO: does it make them 1px?? seems like they are being eroded by drawing
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
};

export const drawGrid = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    ctx.strokeStyle = '#BBBBBB';

    // vertical grid lines
    for (let i = 0; i < LENGTH; i += 6) {
        drawLine(ctx, i, 0, i, LENGTH);
    }

    // horizontal grid lines
    for (let i = 0; i < LENGTH; i += 6) {
        drawLine(ctx, 0, i, LENGTH, i);
    }
};

export const paintWholeCanvas = (
    canvas: HTMLCanvasElement,
    state: Record<string, string> // like { '2,10' : 'ffffff' }
) => {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    for (const coord in state) {
        const [x, y] = coord.split(',');

        ctx.beginPath();
        ctx.fillStyle = `#${state[coord]}`;
        ctx.rect(Number(x), Number(y), 5, 5);
        ctx.fill();
    }
};

export const resetLocalCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    ctx.reset();
    drawGrid(canvas);
};
