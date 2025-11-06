import {createDockerDesktopClient} from '@docker/extension-api-client';
import {errorToString, zDockerDateTime} from './util';
import {type addMessageType} from '../context/LoggingContext';
import {StatusShape, type StatusShapeType} from '@extension/shared/src/types';
import z from 'zod';

export type dockerDesktopClientType = ReturnType<typeof createDockerDesktopClient>;
export type dockerExecvReturnType = ReturnType<dockerDesktopClientType['docker']['cli']['exec']>;

type ResultType = {data: unknown; isError: boolean; error: string};

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
 * Execute docker fetch and parse json result.
 * @param ddClient - The docker desktop client.
 * @param addMessage - The handler to add a message to the logging console.
 * @param url - The url.
 * @returns A promise resolving to a json array when successful or null if not successful.
 */
export const dockerGet = async (ddClient: dockerDesktopClientType, url: string): Promise<ResultType> => {
	const result: ResultType = {data: null, isError: false, error: ''};

	try {
		result.data = await ddClient.extension.vm?.service?.get(url);
	} catch (error) {
		result.isError = true;
		result.error = `Error in dockerGet "${url}"\n${errorToString(error)}`;
	}

	return result;
};

/**
 * Execute docker fetch and parse json result.
 * @param ddClient - The docker desktop client.
 * @param url - The url.
 * @param para - The arguments.
 * @returns A promise resolving to a json array when successful or null if not successful.
 */
export const dockerPost = async (ddClient: dockerDesktopClientType, url: string, para: Record<string, unknown>): Promise<ResultType> => {
	const result: ResultType = {data: null, isError: false, error: ''};

	try {
		result.data = await ddClient.extension.vm?.service?.post(url, para);
	} catch (error) {
		result.isError = true;
		result.error = `Error in dockerPost "${url}"\n${errorToString(error)}`;
	}

	return result;
};

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
 * Fetch backend status.
 * @param ddClient - The docker desktop client.
 * @returns An promise resolvong to an array of containers.
 */
export const fetchStatus = async (ddClient: dockerDesktopClientType, addMessage: addMessageType): Promise<StatusShapeType | null> => {
	const {data, isError, error} = await dockerGet(ddClient, '/containers');
	if (isError) {
		addMessage('Error in fetchContainers', error, 'error');
		return null;
	}

	//addMessage('fetchContainers: json', JSON.stringify(json), 'log');

	try {
		return StatusShape.parse(data);
	} catch (error) {
		const message = `Error parsing containers`;
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
	const {data, isError, error} = await dockerGet(ddClient, '/containers');
	if (isError) {
		addMessage('Error in fetchContainers', error, 'error');
		return [];
	}

	//addMessage('fetchContainers: json', JSON.stringify(json), 'log');

	try {
		return z.array(ContainerInfoShape).parse(data);
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
	const {data, isError, error} = await dockerGet(ddClient, '/images');
	if (isError) {
		addMessage('Error in fetchImages', error, 'error');
		return [];
	}

	//addMessage('fetchImages: json', JSON.stringify(json), 'log');

	try {
		return z.array(ImageInfoShape).parse(data);
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
 * @param containerId - The container id.
 * @param imageName - The image name.
 * @returns A promise when done.
 */
export const commitContainer = async (ddClient: dockerDesktopClientType, addMessage: addMessageType, containerId: string, imageName: string): Promise<void> => {
	//await ddClient.docker.cli.exec('commit', [containerId, imageName]);

	const {data, isError, error} = await dockerPost(ddClient, '/commit', {containerId, imageName});
	if (isError) {
		addMessage('Error in commitContainer', error, 'error');
		return;
	}

	addMessage('fetchImages: json', JSON.stringify(data), 'log');
};

/**
 * Fetch list of images.
 * @param imageName - The image name.
 * @param imageFilename - The image filename.
 * @returns A promise when done.
 */
export const exportImage = async (ddClient: dockerDesktopClientType, addMessage: addMessageType, imageName: string, imageFilename: string): Promise<void> => {
	await ddClient.docker.cli.exec('export', [imageName, '-o', imageFilename]);
};
