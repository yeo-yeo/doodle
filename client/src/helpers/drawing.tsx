import type { MouseEvent } from 'react';
import { LENGTH } from 'Canvas';
import { WebsocketMessageType } from 'WebsocketsContext';

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
}: {
    e: MouseEvent;
    canvas: HTMLCanvasElement;
    drawing: boolean;
    colour: string;
    sendWSMessage: (message: WebsocketMessageType) => void;
}) => {
    if (!drawing) {
        return;
    }
    fillPixel({ e, canvas, colour, sendWSMessage });
};

export const onClick = ({
    e,
    canvas,
    colour,
    sendWSMessage,
}: {
    e: MouseEvent;
    canvas: HTMLCanvasElement;
    colour: string;
    sendWSMessage: (message: WebsocketMessageType) => void;
}) => {
    fillPixel({ e, canvas, colour, sendWSMessage });
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
}: {
    e: MouseEvent;
    canvas: HTMLCanvasElement;
    colour: string;
    sendWSMessage: (message: WebsocketMessageType) => void;
}) => {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        return;
    }

    const elPosition = canvas.getBoundingClientRect();

    const xPos = e.clientX - elPosition.x;
    const yPos = e.clientY - elPosition.y;

    const lowerX = Math.floor(xPos / 10) * 10;
    const lowerY = Math.floor(yPos / 10) * 10;

    ctx.beginPath();
    ctx.fillStyle = `#${colour}`;
    ctx.rect(lowerX, lowerY, 9, 9);
    ctx.fill();

    // send ws event?
    sendWSMessage({
        payload: { x: lowerX, y: lowerY, colour },
        type: 'pixelPainted',
    });
};

// todo - refactor/rename
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
    ctx.rect(x, y, 9, 9);
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
    for (let i = 0; i < LENGTH; i += 10) {
        drawLine(ctx, i, 0, i, LENGTH);
    }

    // horizontal grid lines
    for (let i = 0; i < LENGTH; i += 10) {
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
        ctx.rect(Number(x), Number(y), 9, 9);
        ctx.fill();
    }
};

export const updatePixel = () => {};
