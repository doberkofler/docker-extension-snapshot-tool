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

export const StatusEnumShape = z.enum(['idle', 'running', 'complete', 'failed']);

export const StatusShape = z.strictObject({
	status: StatusEnumShape,
	started: z.date().nullable(),
	error: z.string().nullable(),
	operation: z.enum(['commit', 'save']).nullable(),
});
export type StatusShapeType = z.infer<typeof StatusShape>;
