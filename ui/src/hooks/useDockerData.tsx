import {useCallback, useEffect, useState} from 'react';
import {useLogger} from '../context/LoggingContext';
import {type dockerDesktopClientType, type ContainerInfoType, type ImageInfoType, toastMessage, fetchContainers, fetchImages} from '../utilties/docker';
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
	const {addMessage} = useLogger();
	const [containers, setContainers] = useState<ContainerInfoType[]>([]);
	const [images, setImages] = useState<ImageInfoType[]>([]);
	const [loading, setLoading] = useState(true); // Start true for initial load
	const [error, setError] = useState<string | null>(null);

	const loadDockerData = useCallback(async (): Promise<void> => {
		setLoading(true);
		setError(null);
		try {
			const [containerData, imageData] = await Promise.all([fetchContainers(ddClient, addMessage), fetchImages(ddClient, addMessage)]);
			setContainers(sortByStringProp(containerData, 'Names'));
			setImages(sortByStringProp(imageData, 'Repository'));
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	}, [ddClient]);

	// Auto-load on mount
	useEffect(() => {
		loadDockerData();
	}, [loadDockerData]);

	return {containers, images, loading, error, loadDockerData};
};
