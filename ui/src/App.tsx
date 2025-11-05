import {createDockerDesktopClient} from '@docker/extension-api-client';
import {toastMessage, commitContainer} from './docker';
import {useDockerData} from './useDockerData';
import {Containers} from './components/Containers';
import {Logging} from './components/Logging';
import {Test} from './components/Test';
import {errorToString} from './errorToString';

const ddClient = createDockerDesktopClient();

export const App = () => {
	const {containers, images, loading, error, loadDockerData} = useDockerData(ddClient);

	const handleCommit = async (containerID: string, imageName: string): Promise<void> => {
		try {
			await commitContainer(ddClient, containerID, imageName);
			loadDockerData();
			toastMessage(ddClient, `Container ${containerID} committed successfully to image ${imageName}`, 'success');
		} catch (error) {
			toastMessage(ddClient, `Failed to commit container ${containerID}: ${errorToString(error)}`, 'error');
		}
	};

	const handleExport = async (containerID: string, imageName: string): Promise<void> => {};

	return (
		<>
			<Test ddClient={ddClient} />
			<Containers containers={containers} images={images} onCommit={handleCommit} onExport={handleExport} />
			<Logging />
		</>
	);
};
