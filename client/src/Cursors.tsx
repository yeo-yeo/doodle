import React, {
    useEffect,
    useMemo,
    useState,
    useContext,
    useCallback,
    useRef,
} from 'react';
import { Cursor } from 'Cursor';
import { WebsocketsContext } from 'WebsocketsContext';
import { LENGTH } from 'Canvas';
import { IdentityContext } from 'IdentityContext';

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
    const { userID } = useContext(IdentityContext);

    const { sendWSMessage, addWSMessageListener } =
        useContext(WebsocketsContext);

    type cursorPosition = { x: number; y: number };

    // { userID: {x, y} }
    const [cursorPostitions, setCursorPositions] = useState<
        Record<string, cursorPosition>
    >({});
    const [cursorColours, setCursorColours] = useState<Record<string, string>>(
        {}
    );

    const myCursorPosition = useRef<cursorPosition>({ x: 0, y: 0 });

    const reportCursorPosition = useCallback(
        (e: MouseEvent) => {
            if (!canvasRef.current) {
                return;
            }

            const elPosition = canvasRef.current.getBoundingClientRect();

            const x = e.clientX - elPosition.x;
            const y = e.clientY - elPosition.y;

            if (
                x === myCursorPosition.current.x &&
                y === myCursorPosition.current.y
            ) {
                return;
            }

            myCursorPosition.current = { x, y };

            sendWSMessage({
                payload: { position: { x, y }, userID },
                type: 'cursorPositions',
            });
        },
        [canvasRef, sendWSMessage, userID]
    );

    const debouncedComputeCursorPositions = useMemo(
        () => debounce(5, reportCursorPosition),
        [reportCursorPosition]
    );

    useEffect(() => {
        // Add event listener to track mouse movement
        document.addEventListener('mousemove', debouncedComputeCursorPositions);

        addWSMessageListener((event) => {
            const serverMessage = JSON.parse(event);
            if (serverMessage.type === 'cursorPositions') {
                setCursorPositions(serverMessage.payload);
            }
            if (serverMessage.type === 'cursorColours') {
                setCursorColours(serverMessage.payload);
            }
        });
    }, [
        addWSMessageListener,
        cursorPostitions,
        debouncedComputeCursorPositions,
        reportCursorPosition,
        userID,
    ]);

    const cursors = useMemo(
        () =>
            Object.keys(cursorPostitions).map((key) => {
                return (
                    <Cursor
                        key={key}
                        top={cursorPostitions[key].y}
                        left={cursorPostitions[key].x}
                        cursorUserID={key}
                        colour={cursorColours[key]}
                    />
                );
            }),
        [cursorColours, cursorPostitions]
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
