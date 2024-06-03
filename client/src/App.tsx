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
            <WebsocketsProvider
                setInitialCanvasContent={setInitialCanvasContent}
            >
                <Canvas initialCanvasState={initialCanvasContent} />
            </WebsocketsProvider>
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
