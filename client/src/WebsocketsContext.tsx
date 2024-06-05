import type { ReactNode } from 'react';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { IdentityContext } from 'IdentityContext';

export type WebsocketMessageType = {
    type: string;
    payload: any;
};

type wsMsgCallback = (event: any) => void;

type WebsocketsContextType = {
    addWSMessageListener: (fn: wsMsgCallback) => void;
    sendWSMessage: ({ type, payload }: WebsocketMessageType) => void;
    socketStatus: 'open' | 'closed';
};

export const WebsocketsContext = createContext<WebsocketsContextType>({
    addWSMessageListener: () => {},
    sendWSMessage: () => {},
    socketStatus: 'closed',
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
    const [websocketReadyState, setWebsocketReadyState] = useState<
        'open' | 'closed'
    >('closed');
    const [messageListenersToAttach, setMessageListenersToAttach] = useState<
        wsMsgCallback[]
    >([]);

    const { userID } = useContext(IdentityContext);

    const addWaitingListeners = useCallback(() => {
        if (messageListenersToAttach.length > 0) {
            messageListenersToAttach.forEach((fn) => {
                websocketConnection.current!.on('json', fn);
            });
            setMessageListenersToAttach([]);
        }
        return;
    }, [messageListenersToAttach]);

    const connect = useCallback(() => {
        const socket = io();

        socket.on('connect', () => {
            setWebsocketReadyState('open');
            socket.emit(
                'json',
                JSON.stringify({ type: 'hello', payload: { userID } })
            );
        });

        socket.on('disconnect', () => {
            setWebsocketReadyState('closed');
        });

        socket.on('json', (message) => {
            const serverMessage = JSON.parse(message);
            if (serverMessage.type === 'canvasState') {
                setInitialCanvasContent(serverMessage.payload);
            }
        });

        websocketConnection.current = socket;
    }, [setInitialCanvasContent, userID]);

    // Initial connection
    useEffect(() => {
        if (!websocketConnection.current) {
            connect();
        }

        // return () => websocketConnection.current?.close();
    }, [connect, setInitialCanvasContent]);

    useEffect(() => {
        if (websocketReadyState === 'open') {
            addWaitingListeners();
        }
    }, [addWaitingListeners, websocketReadyState]);

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
        socketStatus: websocketReadyState,
    };

    // todo - if connection isn't established?
    return (
        <WebsocketsContext.Provider value={contextValue}>
            {children}
        </WebsocketsContext.Provider>
    );
};
