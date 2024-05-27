import React, { useEffect, useRef, useState } from 'react';

import {
    drawGrid,
    paintWholeCanvas,
    onClick,
    onDraw,
    onDrawEnd,
    onDrawStart,
} from 'helpers/drawing';
import { Cursors } from 'Cursors';

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

export const Canvas = () => {
    const [canvasContent, setCanvasContent] = useState<Record<string, string>>(
        {}
    );
    const [drawing, setDrawing] = useState(false);
    const [currentColour, setCurrentColour] = useState('000000');

    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        drawGrid(ref.current!);
    }, []);

    useEffect(() => {
        paintWholeCanvas(ref.current!, canvasContent);
    }, [canvasContent]);

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
                        onDraw(e, ref.current!, drawing, currentColour)
                    }
                    onMouseUp={(e) => onDrawEnd(ref.current!, setDrawing)}
                    onClick={(e) => onClick(e, ref.current!, currentColour)}
                    style={{ border: '1px solid black' }}
                ></canvas>
                <Cursors canvasRef={ref} />
            </div>
        </>
    );
};
