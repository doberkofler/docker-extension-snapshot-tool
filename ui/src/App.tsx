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
	try {
		const result = await ddClient.extension.vm?.service?.get('/hello');
		toast(`The response from the server was ${JSON.stringify(result)}`, 'success');
	} catch (error) {
		toast(`Failed to connect to the backend: ${errorToString('', error)}`, 'error');
	}
};

export const App = () => {
	const [containers, setContainers] = useState<ContainerInfo[]>([]);

	useEffect(() => {
		fetchContainers(ddClient).then(setContainers);
	}, []);

	return <Containers containers={containers} onCommit={handleCommit} onExport={handleExport} />;
};
