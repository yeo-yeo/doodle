import React, { useContext, useEffect, useRef, useState } from 'react';

import {
    drawGrid,
    paintWholeCanvas,
    onClick,
    onDraw,
    onDrawEnd,
    onDrawStart,
    fillPixel2,
} from 'helpers/drawing';
import { Cursors } from 'Cursors';
import { WebsocketsContext } from 'WebsocketsContext';

export const LENGTH = 720;

const COLOURS = [
    '000000',
    'FF0000',
    'FFFF00',
    '00FF00',
    '00FFFF',
    '0000FF',
    'FF00FF',
    'FFFFFF',
];

export const Canvas = ({
    initialCanvasState,
}: {
    initialCanvasState: Record<string, string>;
}) => {
    const [drawing, setDrawing] = useState(false);
    const [currentColour, setCurrentColour] = useState('000000');

    const { sendWSMessage, addWSMessageListener } =
        useContext(WebsocketsContext);

    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        drawGrid(ref.current!);
    }, []);

    useEffect(() => {
        addWSMessageListener((event) => {
            const serverMessage = JSON.parse(event.data);
            if (serverMessage.type === 'pixelPainted') {
                const { x, y, colour } = serverMessage.payload;
                fillPixel2({ canvas: ref.current, x, y, colour });
            }
        });
    }, [addWSMessageListener]);

    useEffect(() => {
        paintWholeCanvas(ref.current!, initialCanvasState);
    }, [initialCanvasState]);

    return (
        <>
            <div style={{ display: 'flex' }}>
                {COLOURS.map((colour) => (
                    <div
                        key={colour}
                        style={{
                            background: `#${colour}`,
                            width: '30px',
                            height: '30px',
                            border: '1px solid black',
                        }}
                        onClick={() => setCurrentColour(colour)}
                    ></div>
                ))}
            </div>
            <div style={{ position: 'relative' }}>
                <canvas
                    ref={ref}
                    height={LENGTH}
                    width={LENGTH}
                    onMouseDown={(e) =>
                        onDrawStart(e, ref.current!, setDrawing)
                    }
                    onMouseMove={(e) =>
                        onDraw({
                            e,
                            canvas: ref.current!,
                            drawing,
                            colour: currentColour,
                            sendWSMessage,
                        })
                    }
                    onMouseUp={() => onDrawEnd(ref.current!, setDrawing)}
                    onClick={(e) =>
                        onClick({
                            e,
                            canvas: ref.current!,
                            colour: currentColour,
                            sendWSMessage,
                        })
                    }
                    style={{ border: '1px solid black' }}
                ></canvas>
                <Cursors canvasRef={ref} />
            </div>
        </>
    );
};
