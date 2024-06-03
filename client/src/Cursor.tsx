import React from 'react';

export const Cursor = ({
    left,
    top,
    fill,
}: {
    left: number;
    top: number;
    fill: string;
}) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            height="24"
            viewBox="0 0 24 24"
            width="24"
            style={{
                transform: `translate(${left}px, ${top}px)`,
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
            }}
        >
            <path
                d="m22 10.2069-19-7.2069 7.2069 19 3.2759-8.5172z"
                fill={`#${fill}`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
        </svg>
    );
};
