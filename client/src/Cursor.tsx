import React from 'react';

export const Cursor = ({ left, top }: { left: number; top: number }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            style={{ left, top, position: 'absolute', pointerEvents: 'none' }}
        >
            <path
                d="m22 10.2069-19-7.2069 7.2069 19 3.2759-8.5172z"
                stroke="#000"
                fill="#000"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
        </svg>
    );
};
