import type { ReactNode } from 'react';
import React, { createContext, useState } from 'react';

type IdentityContextType = {
    userID: string;
};

export const IdentityContext = createContext<IdentityContextType>({
    userID: '',
});

export const IdentityProvider = ({ children }: { children: ReactNode }) => {
    const [userID, _] = useState(Math.floor(Math.random() * 100).toString());

    return (
        <IdentityContext.Provider value={{ userID }}>
            {children}
        </IdentityContext.Provider>
    );
};
