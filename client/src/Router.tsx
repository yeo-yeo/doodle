import { App } from 'App';
import { Gallery } from 'Gallery';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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