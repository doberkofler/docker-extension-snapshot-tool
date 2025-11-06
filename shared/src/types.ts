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

const BaseShape = z.strictObject({
	status: z.enum(['idle', 'running', 'complete', 'failed']),
	started: dateFromStringSchema,
	error: z.string(),
});
const CommitShape = z.strictObject({
	operation: z.literal('commit'),
	containerId: z.string(),
	imageName: z.string(),
	...BaseShape.shape,
});
const SaveShape = z.strictObject({
	operation: z.literal('save'),
	imageId: z.string(),
	exportPath: z.string(),
	exportFilename: z.string(),
	...BaseShape.shape,
});

const StateShape = z.discriminatedUnion('operation', [CommitShape, SaveShape]);

export type State = z.infer<typeof StateShape>;
