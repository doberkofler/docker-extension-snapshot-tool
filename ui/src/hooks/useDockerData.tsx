import {useCallback, useEffect, useState} from 'react';
//import {useLogger} from '../context/LoggingContext';
import {type dockerDesktopClientType, type ContainerInfoType, type ImageInfoType, fetchContainers, fetchImages} from '../utilties/docker';
import {sortByStringProp} from '../utilties/util';

export type useDockerDataResultType = {
	containers: ContainerInfoType[];
	images: ImageInfoType[];
	loading: boolean;
	error: string | null;
	loadDockerData: () => Promise<void>;
};

/**
 * Custom hook for Docker data
 */
export const useDockerData = (ddClient: dockerDesktopClientType): useDockerDataResultType => {
	//const {addMessage} = useLogger();
	const [containers, setContainers] = useState<ContainerInfoType[]>([]);
	const [images, setImages] = useState<ImageInfoType[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadDockerData = useCallback(async (): Promise<void> => {
		//addMessage('useDockerData', '', 'log');
		setLoading(true);
		setError(null);
		try {
			const [containerData, imageData] = await Promise.all([fetchContainers(ddClient), fetchImages(ddClient)]);
			setContainers(sortByStringProp(containerData, 'Names'));
			setImages(sortByStringProp(imageData, 'Repository'));
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Auto-load on mount
	useEffect(() => {
		void loadDockerData();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return {containers, images, loading, error, loadDockerData};
};
