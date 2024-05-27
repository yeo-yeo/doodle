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

type WebsocketsContextType = {
    addWSMessageListener: (fn: wsMsgCallback) => void;
    sendWSMessage: ({ type, payload }: WebsocketMessageType) => void;
};

export const WebsocketsContext = createContext<WebsocketsContextType>({
    addWSMessageListener: (fn: wsMsgCallback) => {},
    sendWSMessage: () => {},
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
            console.log('added listener from state');
            setMessageListenersToAttach([]);
        }
        return;
    }, [messageListenersToAttach]);

    // TODO: reconnection?
    // TODO: i think refactoring this broke the websocket setup
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8765');

        // Connection opened
        socket.addEventListener('open', (event) => {
            socket.send('Connection established');
        });

        socket.addEventListener('message', (event) => {
            const serverMessage = JSON.parse(event.data);
            if (serverMessage.type === 'canvasState') {
                console.log('setting initial state');
                setInitialCanvasContent(serverMessage.payload);
            }
        });

        addWaitingListeners();

        websocketConnection.current = socket;
        // maybe set a piece of state to say it's ready???? then other useEffect depends on that?????
        // or maybe there should be a usecallback that you call when it's ready??

        return () => websocketConnection.current?.close();
    }, [addWaitingListeners, setInitialCanvasContent]);

    const addWSMessageListener = (fn: wsMsgCallback) => {
        if (!websocketConnection.current) {
            console.log('adding listener to attach');
            setMessageListenersToAttach((prev) => [...prev, fn]);
            return;
        }
        console.log('directly adding listener');
        websocketConnection.current.addEventListener('message', fn);
    };

    console.log({ messageListenersToAttach });

    const sendWSMessage = (message: WebsocketMessageType) => {
        if (
            websocketConnection.current &&
            websocketConnection.current.readyState === 1
        ) {
            websocketConnection.current.send(JSON.stringify(message));
        }
    };

    const contextValue = { addWSMessageListener, sendWSMessage };

    // todo - if connection isn't established?
    return (
        <WebsocketsContext.Provider value={contextValue}>
            {children}
        </WebsocketsContext.Provider>
    );
};
