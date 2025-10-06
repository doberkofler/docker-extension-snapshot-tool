import {useEffect, useState} from 'react';
import {createDockerDesktopClient} from '@docker/extension-api-client';
import {type ContainerInfo, fetchContainers, commitContainer, exportImage} from './docker';
import {Containers} from './components/Containers';
import {errorToString} from './errorToString';

const ddClient = createDockerDesktopClient();

const toast = (message: string, severity: 'success' | 'error') => ddClient.desktopUI.toast[severity](message);

const handleCommit = async (containerID: string, imageName: string): Promise<void> => {
	try {
		await commitContainer(ddClient, containerID, imageName);
		toast(`Container ${containerID} committed successfully to image ${imageName}`, 'success');
	} catch (error) {
		toast(`Failed to commit container ${containerID}: ${errorToString('', error)}`, 'error');
	}
};

const handleExport = async (containerID: string, imageName: string): Promise<void> => {
	// Commit the container to an image and export the image to a tar file
	try {
		await commitContainer(ddClient, containerID, imageName);
	} catch (error) {
		toast(`Failed to commit container ${containerID}: ${errorToString('', error)}`, 'error');
	}

	// Export the image to a tar file
	/*
	try {
		await exportImage(ddClient, imageName, imageFilename);
		toast(`Container ${containerID} committed successfully to image ${imageName} and exported to file ${imageFilename}`, 'success');
	} catch (error) {
		toast(`Failed to commit container ${containerID}: ${errorToString('', error)}`, 'error');
	}
	*/
};

export const App = () => {
	const [containers, setContainers] = useState<ContainerInfo[]>([]);

	useEffect(() => {
		fetchContainers(ddClient).then(setContainers);
	}, []);

	return <Containers containers={containers} onCommit={handleCommit} onExport={handleExport} />;
};
