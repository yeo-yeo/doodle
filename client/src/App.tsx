import React from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from 'Canvas';
import { WebsocketsProvider } from 'WebsocketsContext';

const App = () => {
    // establish WS connection with user details
    // load state of canvas, other users

    return (
        <>
            <WebsocketsProvider>
                <p>doodle</p>
                <Canvas />
            </WebsocketsProvider>
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
