import React, {
    useEffect,
    useMemo,
    useState,
    useContext,
    useCallback,
} from 'react';
import { Cursor } from 'Cursor';
import { WebsocketsContext } from 'WebsocketsContext';
import { LENGTH } from 'Canvas';

const CURSOR_COLOURS = [
    '000000',
    'FF0000',
    'FFFF00',
    '00FF00',
    '00FFFF',
    '0000FF',
    'FF00FF',
    'FFFFFF',
];

function debounce<TArgs extends unknown[]>(
    delay: number,
    f: (...args: TArgs) => unknown
): (...args: TArgs) => void {
    let timer: ReturnType<typeof setTimeout> | undefined = undefined;
    return (...args: TArgs) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            timer = undefined;
            f(...args);
        }, delay);
    };
}

export const Cursors = ({
    canvasRef,
}: {
    canvasRef: React.RefObject<HTMLCanvasElement>;
}) => {
    const [userID, _setUserID] = useState(
        Math.floor(Math.random() * 100).toString()
    );

    const { sendWSMessage, addWSMessageListener } =
        useContext(WebsocketsContext);

    // { userID: {x, y} }
    const [cursorPostitions, setCursorPositions] = useState<
        Record<string, Record<string, any>>
    >({});

    const reportCursorPosition = useCallback(
        (e: MouseEvent) => {
            if (!canvasRef.current) {
                return;
            }

            const elPosition = canvasRef.current.getBoundingClientRect();

            const x = e.clientX - elPosition.x;
            const y = e.clientY - elPosition.y;

            // Only report position if cursor is over canvas - otherwise hide it
            // if (x >= 0 && x <= LENGTH && y >= 0 && y <= LENGTH) {
            sendWSMessage({
                payload: { position: { x, y }, userID },
                type: 'cursorPositions',
            });
            // } else {
            //     sendWSMessage({
            //         type: 'removeCursor',
            //         payload: { userID },
            //     });
            // }
        },
        [canvasRef, sendWSMessage, userID]
    );

    const debouncedComputeCursorPositions = useMemo(
        () => debounce(10, reportCursorPosition),
        [reportCursorPosition]
    );

    useEffect(() => {
        // Add event listener to track mouse movement
        document.addEventListener('mousemove', debouncedComputeCursorPositions);

        addWSMessageListener((event) => {
            const serverMessage = JSON.parse(event.data);
            if (serverMessage.type === 'cursorPositions') {
                setCursorPositions(serverMessage.payload);
            }
        });

        // not sure this is really necessary now i've just stopped rendering ones out of bounds
        addWSMessageListener((event) => {
            const serverMessage = JSON.parse(event.data);
            if (serverMessage.type === 'removeCursor') {
                // filter out that userid
                const newCursors = { ...cursorPostitions };
                delete newCursors[serverMessage.payload.userID];
                setCursorPositions(newCursors);
            }
        });
    }, [
        addWSMessageListener,
        cursorPostitions,
        debouncedComputeCursorPositions,
        reportCursorPosition,
    ]);

    const cursors = useMemo(
        () =>
            // todo: this must be expensive
            Object.keys(cursorPostitions)
                .filter((key) => {
                    if (key === userID) {
                        return false;
                    }

                    const { x, y } = cursorPostitions[key];

                    return x >= 0 && x <= LENGTH && y >= 0 && y <= LENGTH;
                })
                .map((key) => {
                    // TODO: 100 because we are currently generating user ids as random nos 0 - 99
                    const colour =
                        CURSOR_COLOURS[
                            Math.floor(
                                (Number(key) % 100) /
                                    (100 / CURSOR_COLOURS.length)
                            )
                        ];
                    return (
                        <Cursor
                            key={key}
                            top={cursorPostitions[key].y}
                            left={cursorPostitions[key].x}
                            fill={colour}
                        />
                    );
                }),
        [cursorPostitions, userID]
    );

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: LENGTH,
                width: LENGTH,
                pointerEvents: 'none',
            }}
        >
            {cursors}
        </div>
    );
};
