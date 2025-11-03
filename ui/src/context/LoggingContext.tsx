import {createContext, useContext, useState, ReactNode} from 'react';

export type LoggingMessageType = {
	id: number;
	timestamp: Date;
	severity: 'log' | 'warning' | 'error';
	message: string;
	context: string;
};

type LoggingContextValue = {
	messages: LoggingMessageType[];
	addMessage: (message: string, context: string, severity: LoggingMessageType['severity']) => void;
	clear: () => void;
};

export type addMessageType = LoggingContextValue['addMessage'];

const LoggingContext = createContext<LoggingContextValue | null>(null);

export const LoggingProvider = ({children}: {children: ReactNode}) => {
	const [messages, setMessages] = useState<LoggingMessageType[]>([]);

	const addMessage = (message: string, context: string, severity: LoggingMessageType['severity']): void => {
		setMessages((prev) => [
			...prev,
			{
				id: prev.length > 0 ? prev[prev.length - 1].id + 1 : 1,
				timestamp: new Date(),
				severity,
				message,
				context,
			},
		]);
	};

	const clear = (): void => setMessages([]);

	return <LoggingContext.Provider value={{messages, addMessage, clear}}>{children}</LoggingContext.Provider>;
};

export const useLogger = (): LoggingContextValue => {
	const ctx = useContext(LoggingContext);
	if (!ctx) throw new Error('useLogger must be used within LoggingProvider');
	return ctx;
};
