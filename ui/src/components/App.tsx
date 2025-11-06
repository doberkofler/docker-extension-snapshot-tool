import {createDockerDesktopClient} from '@docker/extension-api-client';
import {toastMessage, commitContainer} from '../utilties/docker';
import {useLogger} from '../context/LoggingContext';
import {useDockerData} from '../hooks/useDockerData';
import {Containers} from './/Containers';
import {Logging} from './Logging';
import {Test} from './Test';
import {errorToString} from '../utilties/errorToString';

const ddClient = createDockerDesktopClient();

export const App = () => {
	const {addMessage} = useLogger();
	const {containers, images, loadDockerData} = useDockerData(ddClient);

	const handleCommit = async (containerID: string, imageName: string): Promise<void> => {
		try {
			await commitContainer(ddClient, addMessage, containerID, imageName);
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
