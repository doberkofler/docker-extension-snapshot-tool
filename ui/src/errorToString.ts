export const errorToString = (error: unknown): string => {
	if (error instanceof Error) {
		return `${error.message}\n${error.stack}`;
	} else if (typeof error === 'string') {
		return error;
	} else {
		try {
			return JSON.stringify(error);
		} catch {
			return 'Error';
		}
	}
};
