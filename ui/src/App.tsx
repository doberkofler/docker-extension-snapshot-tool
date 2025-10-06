import {useEffect, useState} from 'react';
import {createDockerDesktopClient} from '@docker/extension-api-client';
import {type ContainerInfo, fetchContainers, commitContainer} from './docker';
import {Containers} from './components/Containers';
import {errorToString} from './errorToString';
import {formatDateForFilename} from './util';

const ddClient = createDockerDesktopClient();

const toast = (message: string, severity: 'success' | 'error') => ddClient.desktopUI.toast[severity](message);

const handleCommit = async (container: ContainerInfo): Promise<void> => {
	const imageName = `${container.Image}-snapshot-${formatDateForFilename(new Date())}`;

	try {
		await commitContainer(ddClient, container.ID, imageName);
		toast(`Container ${container.ID} committed successfully to image ${imageName}`, 'success');
	} catch (error) {
		toast(`Failed to commit container ${container.ID}: ${errorToString('', error)}`, 'error');
	}
};

const handleExport = async (container: ContainerInfo): Promise<void> => {
	toast(`Container ${container.ID} failed to export`, 'error');
};

export const App = () => {
	const [containers, setContainers] = useState<ContainerInfo[]>([]);

	useEffect(() => {
		fetchContainers(ddClient).then(setContainers);
	}, []);

	return <Containers containers={containers} onCommit={handleCommit} onExport={handleExport} />;
};
