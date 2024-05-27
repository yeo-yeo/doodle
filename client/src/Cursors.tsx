import React, {
    useEffect,
    useMemo,
    useState,
    useContext,
    useCallback,
} from 'react';
import { Cursor } from 'Cursor';
import { WebsocketsContext } from 'WebsocketsContext';

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

            sendWSMessage({
                payload: { position: { x, y }, userID },
                type: 'cursorPositions',
            });
        },
        [canvasRef, sendWSMessage, userID]
    );

    useEffect(() => {
        // Add event listener to track mouse movement
        document.addEventListener('mousemove', reportCursorPosition);

        // Register to listen to WS messages
        addWSMessageListener((event) => {
            const serverMessage = JSON.parse(event.data);
            if (serverMessage.type === 'cursorPositions') {
                setCursorPositions(serverMessage.payload);
            }
        });
    }, [addWSMessageListener, reportCursorPosition]);

    const cursors = useMemo(
        () =>
            Object.keys(cursorPostitions)
                .filter((key) => key !== userID)
                .map((key) => {
                    return (
                        <Cursor
                            key={key}
                            top={cursorPostitions[key].y}
                            left={cursorPostitions[key].x}
                        />
                    );
                }),
        [cursorPostitions, userID]
    );

    return <>{cursors}</>;
};
