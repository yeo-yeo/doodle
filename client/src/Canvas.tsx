import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import {
    drawGrid,
    paintWholeCanvas,
    onClick,
    onDraw,
    onDrawEnd,
    onDrawStart,
    fillPixel2,
    resetLocalCanvas,
} from 'helpers/drawing';
import { Cursors } from 'Cursors';
import { WebsocketsContext } from 'WebsocketsContext';

export const LENGTH = 720;

const COLOURS = [
    'ffffff',
    'fcf305',
    'ff6402',
    'dd0806',
    'f20884',
    '4600a5',
    '0000d4',
    '02abea',
    '1fb714',
    '006411',
    '562c05',
    '90713a',
    'c0c0c0',
    '808080',
    '404040',
    '000000',
];

export type Pixel = { x: number; y: number; colour: string };

export const Canvas = ({
    initialCanvasState,
}: {
    initialCanvasState: Record<string, string>;
}) => {
    const [drawing, setDrawing] = useState(false);
    const [currentColour, setCurrentColour] = useState('000000');

    const { sendWSMessage, addWSMessageListener, socketStatus } =
        useContext(WebsocketsContext);

    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        drawGrid(ref.current!);
    }, []);

    useEffect(() => {
        addWSMessageListener((event) => {
            const serverMessage = JSON.parse(event);
            if (serverMessage.type === 'pixelPainted') {
                const { x, y, colour } = serverMessage.payload;
                fillPixel2({ canvas: ref.current, x, y, colour });
            }
        });
        addWSMessageListener((event) => {
            const serverMessage = JSON.parse(event);
            if (serverMessage.type === 'resetCanvas') {
                resetLocalCanvas(ref.current!);
            }
        });
    }, [addWSMessageListener]);

    useEffect(() => {
        if (socketStatus === 'open') {
            paintWholeCanvas(ref.current!, initialCanvasState);
        }
    }, [initialCanvasState, socketStatus]);

    const lastPixelChange = useRef<Pixel | null>(null);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    margin: '4px',
                    flexWrap: 'wrap',
                    width: '260px',
                }}
            >
                {COLOURS.map((colour) => (
                    <div
                        key={colour}
                        style={{
                            background: `#${colour}`,
                            width: '30px',
                            height: '30px',
                            border: `1px solid ${colour === currentColour ? 'white' : 'black'}`,
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
                    onTouchStart={(e) =>
                        onDrawStart(e, ref.current!, setDrawing)
                    }
                    onMouseMove={(e) =>
                        onDraw({
                            e,
                            canvas: ref.current!,
                            drawing,
                            colour: currentColour,
                            sendWSMessage,
                            lastPixelChange: lastPixelChange,
                        })
                    }
                    onTouchMove={(e) =>
                        onDraw({
                            e,
                            canvas: ref.current!,
                            drawing,
                            colour: currentColour,
                            sendWSMessage,
                            lastPixelChange: lastPixelChange,
                        })
                    }
                    onMouseUp={() => onDrawEnd(ref.current!, setDrawing)}
                    onTouchEnd={() => onDrawEnd(ref.current!, setDrawing)}
                    onClick={(e) =>
                        onClick({
                            e,
                            canvas: ref.current!,
                            colour: currentColour,
                            sendWSMessage,
                            lastPixelChange: lastPixelChange,
                        })
                    }
                    style={{ border: '1px solid black', touchAction: 'none' }}
                ></canvas>
                <Cursors canvasRef={ref} />
            </div>
            <Link to="/gallery" style={{ color: 'yellow', marginTop: '8px' }}>
                Gallery
            </Link>
        </div>
    );
};
