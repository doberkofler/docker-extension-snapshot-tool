import {createDockerDesktopClient} from '@docker/extension-api-client';

export type dockerDesktopClientType = ReturnType<typeof createDockerDesktopClient>;

export type ContainerInfo = {
	ID: string;
	Names: string;
	Image: string;
	Status: string;
};

export const fetchContainers = async (ddClient: dockerDesktopClientType): Promise<ContainerInfo[]> => {
	const res = await ddClient.docker.cli.exec('ps', ['--all', '--format', '"{{json .}}"']);
	return res.parseJsonLines();
};

export const commitContainer = async (ddClient: dockerDesktopClientType, containerID: string, imageName: string): Promise<void> => {
	await ddClient.docker.cli.exec('commit', [containerID, imageName]);
};

export const exportImage = async (ddClient: dockerDesktopClientType, imageName: string, imageFilename: string): Promise<void> => {
	await ddClient.docker.cli.exec('export', [imageName, '-o', imageFilename]);
};
