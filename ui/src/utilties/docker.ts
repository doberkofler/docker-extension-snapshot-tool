import {createDockerDesktopClient} from '@docker/extension-api-client';
import {errorToString, zDockerDateTime} from './util';
import {type addMessageType} from '../context/LoggingContext';
import z from 'zod';

export type dockerDesktopClientType = ReturnType<typeof createDockerDesktopClient>;
export type dockerExecvReturnType = ReturnType<dockerDesktopClientType['docker']['cli']['exec']>;

const ContainerInfoShape = z.looseObject({
	ID: z.string(),
	Names: z.string(),
	Image: z.string(),
	Status: z.string(),
	CreatedAt: zDockerDateTime,
});
export type ContainerInfoType = z.infer<typeof ContainerInfoShape>;

const ImageInfoShape = z.looseObject({
	ID: z.string(),
	Repository: z.string(),
	Tag: z.string(),
	Size: z.string(),
	CreatedAt: zDockerDateTime,
});
export type ImageInfoType = z.infer<typeof ImageInfoShape>;

/**
 * Toast message.
 * @param ddClient - The docker desktop client.
 * @param message - The message.
 * @param severity - The severity.
 */
export const toastMessage = (ddClient: dockerDesktopClientType, message: string, severity: 'success' | 'error') => ddClient.desktopUI.toast[severity](message);

/**
 * Execute docker command and parse json result.
 * @param ddClient - The docker desktop client.
 * @param addMessage - The handler to add a message to the logging console.
 * @param cmd - The command.
 * @param args - The arguments.
 * @returns A promise resolving to a json array when successful or null if not successful.
 */
export const dockerExecJson = async (ddClient: dockerDesktopClientType, addMessage: addMessageType, cmd: string, args: string[]): Promise<unknown> => {
	let res;
	try {
		res = await ddClient.docker.cli.exec(cmd, args);
	} catch (error) {
		const message = `Error running "${cmd}"`;
		const severity = 'error';

		addMessage(message, errorToString(error), severity);
		toastMessage(ddClient, message, severity);

		return null;
	}

	try {
		return res.parseJsonLines();
	} catch (error) {
		const message = `Error parsing json`;
		const severity = 'error';

		addMessage(message, errorToString(error), severity);
		toastMessage(ddClient, message, severity);

		return null;
	}
};

/**
 * Fetch list of containers.
 * @param ddClient - The docker desktop client.
 * @returns An promise resolvong to an array of containers.
 */
export const fetchContainers = async (ddClient: dockerDesktopClientType): Promise<ContainerInfoType[]> => {
	const result = await ddClient.docker.cli.exec('ps', ['--all', '--format', '"{{json .}}"']);
	const json = result.parseJsonLines();
	const {data, success, error} = z.array(ContainerInfoShape).safeParse(json);

	if (!success) {
		throw new Error(z.prettifyError(error));
	}

	return data;
};

/**
 * Fetch list of images.
 * @param ddClient - The docker desktop client.
 * @returns An promise resolvong to an array of images.
 */
export const fetchImages = async (ddClient: dockerDesktopClientType): Promise<ImageInfoType[]> => {
	const result = await ddClient.docker.cli.exec('image', ['ls', '--all', '--format', '"{{json .}}"']);
	const json = result.parseJsonLines();
	const {data, success, error} = z.array(ImageInfoShape).safeParse(json);

	if (!success) {
		throw new Error(z.prettifyError(error));
	}

	return data;
};

/**
 * Commit container to image.
 * @param ddClient - The docker desktop client.
 * @param containerId - The container id.
 * @param imageName - The image name.
 * @returns A promise when done.
 */
export const containerCommit = async (ddClient: dockerDesktopClientType, containerId: string, imageName: string): Promise<void> => {
	await ddClient.docker.cli.exec('commit', [containerId, imageName]);
};

/**
 * Export image.
 * @param imageId - The image id.
 * @returns A promise when done.
 */
export const imageExport = async (ddClient: dockerDesktopClientType, imageId: string, imageFilename: string): Promise<void> => {
	await ddClient.docker.cli.exec('save', [imageId, '-o', imageFilename]);
};

/**
 * Delete image.
 * @param imageId - The image id.
 * @returns A promise when done.
 */
export const imageDelete = async (ddClient: dockerDesktopClientType, imageId: string): Promise<void> => {
	await ddClient.docker.cli.exec('image', ['rm', imageId]);
};
