import type { ReactNode } from 'react';
import React, {
    createContext,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

export type WebsocketMessageType = {
    type: string;
    payload: any;
};

type wsMsgCallback = (event: any) => void;

export enum ReadyState {
    UNINSTANTIATED = -1,
    CONNECTING = 0,
    OPEN = 1,
    CLOSING = 2,
    CLOSED = 3,
}

type WebsocketsContextType = {
    addWSMessageListener: (fn: wsMsgCallback) => void;
    sendWSMessage: ({ type, payload }: WebsocketMessageType) => void;
    readyState: ReadyState;
};

export const WebsocketsContext = createContext<WebsocketsContextType>({
    addWSMessageListener: (fn: wsMsgCallback) => {},
    sendWSMessage: () => {},
    readyState: -1,
});

export const WebsocketsProvider = ({
    children,
    setInitialCanvasContent: setInitialCanvasContent,
}: {
    children: ReactNode;
    setInitialCanvasContent: React.Dispatch<
        React.SetStateAction<Record<string, string>>
    >;
}) => {
    const websocketConnection = useRef<WebSocket | null>(null);
    const [websocketReadyState, setWebsocketReadyState] =
        useState<ReadyState>(-1);
    const [messageListenersToAttach, setMessageListenersToAttach] = useState<
        wsMsgCallback[]
    >([]);

    const addWaitingListeners = useCallback(() => {
        if (messageListenersToAttach.length > 0) {
            // TODO: is there a better way to do this
            // (does this even work?)
            messageListenersToAttach.forEach((fn) => {
                websocketConnection.current!.addEventListener('message', fn);
            });
            setMessageListenersToAttach([]);
        }
        return;
    }, [messageListenersToAttach]);

    // TODO: reconnection?
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8765');

        // Connection opened
        socket.addEventListener('open', () => {
            setWebsocketReadyState(ReadyState.OPEN);
            // socket.send('Connection established');
        });

        socket.addEventListener('close', () => {
            setWebsocketReadyState(ReadyState.CLOSED);
            socket.send('Connection closed');
        });

        socket.addEventListener('message', (event) => {
            const serverMessage = JSON.parse(event.data);
            if (serverMessage.type === 'canvasState') {
                setInitialCanvasContent(serverMessage.payload);
            }
        });

        websocketConnection.current = socket;
        setWebsocketReadyState(socket.readyState);

        return () => websocketConnection.current?.close();
    }, [setInitialCanvasContent]);

    useEffect(() => {
        if (websocketReadyState === ReadyState.OPEN) {
            addWaitingListeners();
        }
    }, [addWaitingListeners, websocketReadyState]);

    const addWSMessageListener = (fn: wsMsgCallback) => {
        if (!websocketConnection.current) {
            setMessageListenersToAttach((prev) => [...prev, fn]);
            return;
        }
        websocketConnection.current.addEventListener('message', fn);
    };

    const sendWSMessage = (message: WebsocketMessageType) => {
        if (
            websocketConnection.current &&
            websocketConnection.current.readyState === 1
        ) {
            websocketConnection.current.send(JSON.stringify(message));
        }
    };

    const contextValue = {
        addWSMessageListener,
        sendWSMessage,
        readyState: websocketReadyState,
    };

    // todo - if connection isn't established?
    return (
        <WebsocketsContext.Provider value={contextValue}>
            {children}
        </WebsocketsContext.Provider>
    );
};
