import {createDockerDesktopClient} from '@docker/extension-api-client';
import {errorToString, zDockerDateTime} from './util';
import {type addMessageType} from './context/LoggingContext';
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
export const fetchContainers = async (ddClient: dockerDesktopClientType, addMessage: addMessageType): Promise<ContainerInfoType[]> => {
	const json = await dockerExecJson(ddClient, addMessage, 'ps', ['--all', '--format', '"{{json .}}"']);
	if (json === null) {
		return [];
	}

	//addMessage('fetchContainers: json', JSON.stringify(json), 'log');

	try {
		return z.array(ContainerInfoShape).parse(json);
	} catch (error) {
		const message = `Error parsing containers`;
		const severity = 'error';

		addMessage(message, errorToString(error), severity);
		toastMessage(ddClient, message, severity);

		return [];
	}
};

/**
 * Fetch list of images.
 * @param ddClient - The docker desktop client.
 * @returns An promise resolvong to an array of images.
 */
export const fetchImages = async (ddClient: dockerDesktopClientType, addMessage: addMessageType): Promise<ImageInfoType[]> => {
	const json = await dockerExecJson(ddClient, addMessage, 'image ls', ['--all', '--format', '"{{json .}}"']);
	if (json === null) {
		return [];
	}

	//addMessage('fetchImages: json', JSON.stringify(json), 'log');

	try {
		return z.array(ImageInfoShape).parse(json);
	} catch (error) {
		const message = `Error parsing images`;
		const severity = 'error';

		addMessage(message, errorToString(error), severity);
		toastMessage(ddClient, message, severity);

		return [];
	}
};

/**
 * Commit container to image.
 * @param ddClient - The docker desktop client.
 * @param containerID - The container id.
 * @param imageName - The image name.
 * @returns A promise when done.
 */
export const commitContainer = async (ddClient: dockerDesktopClientType, containerID: string, imageName: string): Promise<void> => {
	await ddClient.docker.cli.exec('commit', [containerID, imageName]);
};

/**
 * Fetch list of images.
 * @param imageName - The image name.
 * @param imageFilename - The image filename.
 * @returns A promise when done.
 */
export const exportImage = async (ddClient: dockerDesktopClientType, imageName: string, imageFilename: string): Promise<void> => {
	await ddClient.docker.cli.exec('export', [imageName, '-o', imageFilename]);
};
