import React, { useContext } from 'react';
import { LENGTH } from 'Canvas';
import { IdentityContext } from 'IdentityContext';

export const Cursor = ({
    left,
    top,
    cursorUserID,
    colour,
}: {
    left: number;
    top: number;
    cursorUserID: string;
    colour: string;
}) => {
    const { userID: viewerUserID } = useContext(IdentityContext);

    if (viewerUserID === cursorUserID) {
        return null;
    }

    if (left < 0 || left > LENGTH || top < 0 || top > LENGTH) {
        return null;
    }

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
                fill={`#${colour}`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
            />
        </svg>
    );
};
