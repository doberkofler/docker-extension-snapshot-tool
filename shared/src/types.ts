import {z} from 'zod';

export const dateFromStringSchema = z.string().transform((val, ctx) => {
	const d = new Date(val);

	if (isNaN(d.getTime())) {
		ctx.addIssue({
			code: 'custom',
			message: 'Invalid date string',
		});

		return z.NEVER;
	}

	return d;
});
