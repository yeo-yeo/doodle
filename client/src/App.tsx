import React, { useState } from 'react';
import { Canvas } from 'Canvas';
import { WebsocketsProvider } from 'WebsocketsContext';
import { IdentityProvider } from 'IdentityContext';

export const App = () => {
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
