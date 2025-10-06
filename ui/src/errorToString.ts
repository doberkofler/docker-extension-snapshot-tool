export const errorToString = (message: string, error: unknown): string => {
	if (error instanceof Error) {
		return `${message}\n${error.message}\n${error.stack}`;
	} else if (typeof error === 'string') {
		return `${message}\n${error}`;
	} else {
		try {
			return `${message}\n${JSON.stringify(error)}`;
		} catch {
			return message;
		}
	}
};
