import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from 'Canvas';
import { WebsocketsProvider } from 'WebsocketsContext';

const App = () => {
    const [initialCanvasContent, setInitialCanvasContent] = useState<
        Record<string, string>
    >({});

    return (
        <>
            <WebsocketsProvider setInitialCanvasContent={setInitialCanvasContent}>
                <p>doodle</p>
                {/* actually want this to be a one time thing and incrementally do other updates */}
                <Canvas canvasState={initialCanvasContent} />
            </WebsocketsProvider>
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
