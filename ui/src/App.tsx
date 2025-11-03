import {useLogger} from './context/LoggingContext';
import {createDockerDesktopClient} from '@docker/extension-api-client';
import {toastMessage, commitContainer} from './docker';
import {useDockerData} from './useDockerData';
import {Containers} from './components/Containers';
import {Logging} from './components/Logging';
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
			toastMessage(ddClient, `Failed to commit container ${containerID}: ${errorToString('', error)}`, 'error');
		}
	};

	const handleExport = async (containerID: string, imageName: string): Promise<void> => {
		try {
			const result = await ddClient.extension.vm?.service?.get('/hello');
			loadDockerData();
			toastMessage(ddClient, `The response from the server was ${JSON.stringify(result)}`, 'success');
		} catch (error) {
			toastMessage(ddClient, `Failed to connect to the backend: ${errorToString('', error)}`, 'error');
		}
	};

	return (
		<>
			<Containers containers={containers} images={images} onCommit={handleCommit} onExport={handleExport} />
			<Logging />
		</>
	);
};
