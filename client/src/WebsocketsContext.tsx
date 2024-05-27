import type { ReactNode } from 'react';
import React, { createContext, useEffect, useRef, useState } from 'react';

type WebsocketMessageType = {
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

export const WebsocketsProvider = ({ children }: { children: ReactNode }) => {
    const websocketConnection = useRef<WebSocket | null>(null);
    const [messageListenersToAttach, setMessageListenersToAttach] = useState<
        wsMsgCallback[]
    >([]);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8765');

        // Connection opened
        socket.addEventListener('open', (event) => {
            socket.send('Connection established');
        });

        // TODO: is there a better way to do this
        messageListenersToAttach.forEach((fn) => {
            socket.addEventListener('message', fn);
        });
        setMessageListenersToAttach([]);

        websocketConnection.current = socket;

        return () => websocketConnection.current?.close();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const addWSMessageListener = (fn: wsMsgCallback) => {
        if (!websocketConnection.current) {
            setMessageListenersToAttach([...messageListenersToAttach, fn]);
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

    const contextValue = { addWSMessageListener, sendWSMessage };

    // todo - if connection isn't established?
    return (
        <WebsocketsContext.Provider value={contextValue}>
            {children}
        </WebsocketsContext.Provider>
    );
};
