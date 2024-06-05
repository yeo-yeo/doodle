import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from 'Canvas';
import { WebsocketsProvider } from 'WebsocketsContext';
import { IdentityProvider } from 'IdentityContext';

const App = () => {
    const [initialCanvasContent, setInitialCanvasContent] = useState<
        Record<string, string>
    >({});

    return (
        <>
            <IdentityProvider>
                <WebsocketsProvider
                    setInitialCanvasContent={setInitialCanvasContent}
                >
                    <Canvas initialCanvasState={initialCanvasContent} />
                </WebsocketsProvider>
            </IdentityProvider>
        </>
    );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
