import React, {useState} from 'react';
import {Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography} from '@mui/material';
import {SaveAlt} from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import {imageExport, imageDelete, type ImageInfoType, type dockerDesktopClientType} from '../utilties/docker';
import {useLogger} from '../context/LoggingContext';
import {ActionIconButton} from './ActionIconButton';
import {errorToString} from '../utilties/errorToString';

type ImagesProps = {
	readonly images: ImageInfoType[];
	readonly ddClient: dockerDesktopClientType;
	readonly refresh: () => Promise<void>;
};

type RunningState = Record<string, 'export' | 'delete' | null>;

const getImageFilename = (path: string, name: string, tag: string): string => {
	const safeName = name.replace(/[^\w.-]+/g, '_');
	const safeTag = tag.replace(/[^\w.-]+/g, '_');

	return `${path}/${safeName}_${safeTag}.tar`;
};

export const Images: React.FC<ImagesProps> = ({images, ddClient, refresh}) => {
	const [running, setRunning] = useState<RunningState>({});
	const {addMessage} = useLogger();

	const handleExport = async (image: ImageInfoType) => {
		const result = await ddClient.desktopUI.dialog.showOpenDialog({
			properties: ['openDirectory'],
		});
		if (result.canceled) {
			return;
		}

		const fullPath = getImageFilename(result.filePaths[0], image.Repository, image.Tag);

		setRunning((prev) => ({...prev, [image.ID]: 'export'}));
		try {
			await imageExport(ddClient, image.ID, fullPath);
			await refresh();
			addMessage(`Image "${image.Repository}:${image.Tag}" committed successfully to file "${fullPath}"`, '', 'log');
		} catch (error) {
			addMessage(`Failed to commit container "${image.Repository}:${image.Tag}" to image "${fullPath}"`, errorToString(error), 'error');
		} finally {
			setRunning((prev) => ({...prev, [image.ID]: null}));
		}
	};

	const handleDelete = async (image: ImageInfoType) => {
		setRunning((prev) => ({...prev, [image.ID]: 'delete'}));
		try {
			await imageDelete(ddClient, image.ID);
			await refresh();
			addMessage(`Image "${image.Repository}:${image.Tag}" successfully deleted`, '', 'log');
		} catch (error) {
			addMessage(`Failed to delete image "${image.Repository}:${image.Tag}"`, errorToString(error), 'error');
		} finally {
			setRunning((prev) => ({...prev, [image.ID]: null}));
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
			<Table stickyHeader size="small" aria-label="images table">
				<TableHead>
					<TableRow sx={{backgroundColor: 'grey.100'}}>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								ID
							</Typography>
						</TableCell>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								Name
							</Typography>
						</TableCell>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								Tag
							</Typography>
						</TableCell>
						<TableCell>
							<Typography variant="subtitle2" fontWeight={600}>
								Size
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
					{images.map((c) => {
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
								<TableCell sx={{fontFamily: 'monospace'}}>{c.ID}</TableCell>
								<TableCell>{c.Repository}</TableCell>
								<TableCell>{c.Tag}</TableCell>
								<TableCell>{c.Size}</TableCell>
								<TableCell align="center">
									<ActionIconButton
										title="Export"
										icon={<SaveAlt fontSize="small" />}
										loading={activeAction === 'export'}
										disabled={isRowDisabled}
										onClick={() => {
											void handleExport(c);
										}}
									/>
									<ActionIconButton
										title="Delete"
										icon={<DeleteIcon fontSize="small" />}
										loading={activeAction === 'delete'}
										disabled={isRowDisabled}
										onClick={() => {
											void handleDelete(c);
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
