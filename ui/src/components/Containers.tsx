import React, {useState} from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography} from '@mui/material';
import {Commit} from '@mui/icons-material';
import {containerCommit, type ContainerInfoType, type ImageInfoType, type dockerDesktopClientType} from '../utilties/docker';
import {useLogger} from '../context/LoggingContext';
import {ActionIconButton} from './ActionIconButton';
import {errorToString} from '../utilties/errorToString';
import {showPrompt} from './showPrompt';

type ContainersProps = {
	readonly containers: ContainerInfoType[];
	readonly images: ImageInfoType[];
	readonly ddClient: dockerDesktopClientType;
	readonly refresh: () => Promise<void>;
};

type RunningState = Record<string, 'commit' | 'export' | null>;

const getDefaultImageName = (imageName: string, images: ImageInfoType[]): string => {
	const filteredNames = images
		.filter((e) => e.Repository.startsWith(imageName))
		.sort((a, b) => a.CreatedAt.getTime() - b.CreatedAt.getTime())
		.map((e) => e.Repository);

	//addMessage('getDefaultImageName', `imageName="${imageName}" filteredNames="${filteredNames.join(', ')}"`, 'log');

	if (filteredNames.length > 0) {
		const lastFilename = filteredNames[filteredNames.length - 1];
		const prefix = `${imageName}-snapshot-`;
		//const escapedPrefix = escapeRegex(prefix);
		if (lastFilename.startsWith(prefix)) {
			const match = new RegExp(`^${prefix}(\\d+)`).exec(lastFilename);
			let snapshotNumber = match ? parseInt(match[1], 10) : null;
			if (snapshotNumber !== null) {
				snapshotNumber++;
				return `${imageName}-snapshot-${snapshotNumber}`;
			}
		}
	}

	return `${imageName}-snapshot-1`;
};

export const Containers: React.FC<ContainersProps> = ({containers, images, ddClient, refresh}) => {
	const [running, setRunning] = useState<RunningState>({});
	const {addMessage} = useLogger();

	const handleCommit = async (container: ContainerInfoType) => {
		const defaultImageName = getDefaultImageName(container.Image, images);
		const imageName = await showPrompt({title: 'Commit container to image', label: 'Image name', defaultValue: defaultImageName});
		if (!imageName) {
			return;
		}

		setRunning((prev) => ({...prev, [container.ID]: 'commit'}));
		try {
			await containerCommit(ddClient, container.ID, imageName);
			await refresh();

			addMessage(`Container "${container.Names}" committed successfully to image "${imageName}"`, '', 'log');
		} catch (error) {
			addMessage(`Failed to commit container "${container.Names}" to image "${imageName}"`, errorToString(error), 'error');
		} finally {
			setRunning((prev) => ({...prev, [container.ID]: null}));
		}
	};

	return (
		<TableContainer
			component={Paper}
			sx={{
				mt: 2,
				borderRadius: 2,
				boxShadow: 3,
				maxHeight: 500,
				overflowY: 'auto',
			}}
		>
			<Table stickyHeader size="small" aria-label="containers table">
				<TableHead>
					<TableRow sx={{backgroundColor: 'grey.100'}}>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								Name
							</Typography>
						</TableCell>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								Container ID
							</Typography>
						</TableCell>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								Image
							</Typography>
						</TableCell>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								Status
							</Typography>
						</TableCell>
						<TableCell align="center">
							<Typography variant="subtitle2" fontWeight={600}>
								Actions
							</Typography>
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{containers.map((c) => {
						const activeAction = running[c.ID];
						const isRowDisabled = Boolean(activeAction);

						return (
							<TableRow
								key={c.ID}
								hover
								sx={{
									'&:hover': {backgroundColor: 'action.hover'},
								}}
							>
								<TableCell>{c.Names}</TableCell>
								<TableCell sx={{fontFamily: 'monospace'}}>{c.ID}</TableCell>
								<TableCell>{c.Image}</TableCell>
								<TableCell>
									<Typography
										variant="body2"
										sx={{
											color: c.Status?.includes('Up') ? 'success.main' : 'error.main',
											fontWeight: 500,
										}}
									>
										{c.Status}
									</Typography>
								</TableCell>
								<TableCell align="center">
									<ActionIconButton
										title="Commit"
										icon={<Commit fontSize="small" />}
										loading={activeAction === 'commit'}
										disabled={isRowDisabled}
										onClick={() => {
											void handleCommit(c);
										}}
									/>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</TableContainer>
	);
};
