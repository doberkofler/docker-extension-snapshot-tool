import {createContext, useContext, ReactNode} from 'react';
import {createDockerDesktopClient} from '@docker/extension-api-client';

type dockerDesktopClientType = ReturnType<typeof createDockerDesktopClient>;

type AppContextValue = {
	ddClient: dockerDesktopClientType;
};

const AppContext = createContext<AppContextValue | null>(null);

export const AppContextProvider = ({ddClient, children}: {readonly ddClient: dockerDesktopClientType; readonly children: ReactNode}) => {
	// FIXME: fix this!
	// eslint-disable-next-line react/jsx-no-constructed-context-values
	return <AppContext.Provider value={{ddClient}}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
	const ctx = useContext(AppContext);

	if (!ctx) {
		throw new Error('useApp must be used within AppContextProvider');
	}

	return ctx;
};
