import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from 'App';
import { Gallery } from 'Gallery';

const router = createBrowserRouter([
    {
        path: '/',
        element: <App />,
    },
    {
        path: 'gallery',
        element: <Gallery />,
    },
]);

createRoot(document.getElementById('root')!).render(
    <RouterProvider router={router} />
);
