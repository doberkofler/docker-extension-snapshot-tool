import React, {useState} from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, Tooltip, CircularProgress} from '@mui/material';
import {Commit, SaveAlt} from '@mui/icons-material';
import {type ContainerInfoType, type ImageInfoType} from '../utilties/docker';
import {useLogger, type addMessageType} from '../context/LoggingContext';
import {ActionIconButton} from './ActionIconButton';
import {showPrompt} from './showPrompt';
import {escapeRegex, formatDateForFilename} from '../utilties/util';

type ContainersProps = {
	containers: ContainerInfoType[];
	images: ImageInfoType[];
	onCommit: (containerID: string, imageName: string) => Promise<void>;
	onExport: (containerID: string, imageName: string) => Promise<void>;
};

type RunningState = Record<string, 'commit' | 'export' | null>;

const getDefaultImageName = (imageName: string, images: ImageInfoType[], addMessage: addMessageType): string => {
	const filteredNames = images
		.filter((e) => e.Repository.startsWith(`${imageName}`))
		.sort((a, b) => a.CreatedAt.getTime() - b.CreatedAt.getTime())
		.map((e) => e.Repository);

	//addMessage('getDefaultImageName', `imageName="${imageName}" filteredNames="${filteredNames.join(', ')}"`, 'log');

	if (filteredNames.length > 0) {
		const lastFilename = filteredNames[filteredNames.length - 1];
		const prefix = `${imageName}-snapshot-`;
		const escapedPrefix = escapeRegex(prefix);
		if (lastFilename.startsWith(prefix)) {
			const match = lastFilename.match(new RegExp(`^${prefix}(\\d+)`));
			let snapshotNumber = match ? parseInt(match[1], 10) : null;
			if (snapshotNumber !== null) {
				snapshotNumber++;
				return `${imageName}-snapshot-${snapshotNumber}`;
			}
		}
	}

	return `${imageName}-snapshot-1`;
};

export const Containers: React.FC<ContainersProps> = ({containers, images, onCommit, onExport}) => {
	const [running, setRunning] = useState<RunningState>({});
	const {addMessage} = useLogger();

	const handleCommit = async (container: ContainerInfoType) => {
		const defaultImageName = getDefaultImageName(container.Image, images, addMessage);
		const imageName = await showPrompt({title: 'Commit container to image', label: 'Image name', defaultValue: defaultImageName});
		if (!imageName) {
			return;
		}

		setRunning((prev) => ({...prev, [container.ID]: 'commit'}));
		try {
			await onCommit(container.ID, imageName);
		} finally {
			setRunning((prev) => ({...prev, [container.ID]: null}));
		}
	};

	const handleExport = async (container: ContainerInfoType) => {
		const defaultImageName = `${container.Image}-snapshot-${formatDateForFilename(new Date())}`;
		const imageName = await showPrompt({title: 'Commit container to image and export image', label: 'Image name', defaultValue: defaultImageName});
		if (!imageName) {
			return;
		}

		setRunning((prev) => ({...prev, [container.ID]: 'export'}));
		try {
			await onExport(container.ID, imageName);
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
											color: c.Status?.includes('Up') === true ? 'success.main' : 'error.main',
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
										onClick={() => handleCommit(c)}
									/>
									<ActionIconButton
										title="Export"
										icon={<SaveAlt fontSize="small" />}
										loading={activeAction === 'export'}
										disabled={isRowDisabled}
										onClick={() => handleExport(c)}
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
