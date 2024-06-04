import type { ReactNode } from 'react';
import React, {
    createContext,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Socket, io } from 'socket.io-client';

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
    addWSMessageListener: () => {},
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
    const websocketConnection = useRef<Socket | null>(null);
    const [websocketReadyState, setWebsocketReadyState] =
        useState<ReadyState>(-1);
    const [messageListenersToAttach, setMessageListenersToAttach] = useState<
        wsMsgCallback[]
    >([]);
    const [attachedListeners, setAttachedListeners] = useState<wsMsgCallback[]>(
        []
    );

    const addWaitingListeners = useCallback(() => {
        if (messageListenersToAttach.length > 0) {
            messageListenersToAttach.forEach((fn) => {
                websocketConnection.current!.addEventListener('message', fn);
            });
            // save them in case we reconnect and need to re-add
            setAttachedListeners(messageListenersToAttach);
            setMessageListenersToAttach([]);
        }
        return;
    }, [messageListenersToAttach]);

    // const WS_URL =
    //     window.location.href.includes('localhost') ||
    //     window.location.href.includes('127.0.0.1')
    //         ? 'ws://localhost:8080'
    //         : 'wss://doodle.rcdis.co';

    const connect = useCallback(() => {
        const socket = io();

        socket.on('connect', () => {
            setWebsocketReadyState(ReadyState.OPEN);
        });

        socket.on('disconnect', () => {
            setWebsocketReadyState(ReadyState.CLOSED);
        });

        socket.on('json', (message) => {
            const serverMessage = JSON.parse(message);
            if (serverMessage.type === 'canvasState') {
                setInitialCanvasContent(serverMessage.payload);
            }
        });

        websocketConnection.current = socket;
        // return socket.readyState;
        return 1;
    }, [setInitialCanvasContent]);

    // TODO this is a mess
    const reconnect = useCallback(() => {
        if (websocketConnection?.current?.readyState === ReadyState.OPEN) {
            return;
        }

        const socketState = connect();

        if (
            socketState === ReadyState.CLOSED ||
            socketState === ReadyState.CONNECTING
        ) {
            setTimeout(() => reconnect(), 3000);
        }
    }, [connect]);

    // Initial connection
    useEffect(() => {
        if (!websocketConnection.current) {
            const socketState = connect();
            setWebsocketReadyState(socketState);
        }

        // bug in dev mode?? https://github.com/miguelgrinberg/flask-sock/issues/70
        // commenting this out doesnt fix it though
        return () => websocketConnection.current?.close();
    }, [connect, setInitialCanvasContent]);

    useEffect(() => {
        if (websocketReadyState === ReadyState.OPEN) {
            addWaitingListeners();
        }

        if (websocketReadyState === ReadyState.CLOSED) {
            reconnect();
        }
    }, [addWaitingListeners, reconnect, websocketReadyState]);

    const addWSMessageListener = (fn: wsMsgCallback) => {
        if (!websocketConnection.current) {
            setMessageListenersToAttach((prev) => [...prev, fn]);
            return;
        }
        websocketConnection.current.on('json', fn);
    };

    const sendWSMessage = (message: WebsocketMessageType) => {
        if (websocketConnection.current) {
            websocketConnection.current.emit('json', JSON.stringify(message));
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
