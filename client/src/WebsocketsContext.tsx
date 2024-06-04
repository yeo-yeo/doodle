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
    const websocketConnection = useRef<WebSocket | null>(null);
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

    const WS_URL =
        window.location.href.includes('localhost') ||
        window.location.href.includes('127.0.0.1')
            ? 'ws://localhost:8080/ws'
            : 'wss://doodle.rcdis.co/ws';

    const connect = useCallback(() => {
        const socket = new WebSocket(WS_URL);

        // Connection opened
        socket.addEventListener('open', () => {
            setWebsocketReadyState(ReadyState.OPEN);
            // socket.send('Connection established');

            // ?? (re)add listners here
        });

        socket.addEventListener('close', () => {
            setWebsocketReadyState(ReadyState.CLOSED);

            console.log('on close fired');
        });

        socket.addEventListener('error', () => {
            setWebsocketReadyState(ReadyState.CLOSED);

            console.log(
                'on error fired. ready state is',
                websocketConnection.current?.readyState
            );
        });

        socket.addEventListener('message', (event) => {
            const serverMessage = JSON.parse(event.data);
            if (serverMessage.type === 'canvasState') {
                setInitialCanvasContent(serverMessage.payload);
            }
        });

        websocketConnection.current = socket;
        return socket.readyState;
    }, [WS_URL, setInitialCanvasContent]);

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
