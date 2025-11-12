import * as React from 'react';
import {Tabs, Tab, Box} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import RefreshIcon from '@mui/icons-material/Refresh';
import {createDockerDesktopClient} from '@docker/extension-api-client';
import {useDockerData} from '../hooks/useDockerData';
import {useLogger, type addMessageType} from '../context/LoggingContext';
import {Containers} from './Containers';
import {Images} from './Images';
import {AppContextProvider} from '../context/AppContext';
import {ActionIconButton} from './ActionIconButton';
import {Logging} from './Logging';
import {OperationDialog} from './OperationDialog';

interface TabPanelProps {
	readonly children?: React.ReactNode;
	readonly index: number;
	readonly value: number;
}

const ddClient = createDockerDesktopClient();

const CustomTabPanel = (props: TabPanelProps) => {
	const {children, value, index, ...other} = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`} aria-labelledby={`tab-${index}`} {...other}>
			{value === index && <Box sx={{p: 1}}>{children}</Box>}
		</div>
	);
};

const a11yProps = (index: number) => {
	return {
		id: `tab-${index}`,
		'aria-controls': `tabpanel-${index}`,
	};
};

const openDialog = async (): Promise<string | null> => {
	const result = await ddClient.desktopUI.dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [{name: 'Docker Images', extensions: ['tar']}],
	});

	if (result.canceled || result.filePaths.length === 0) {
		return null;
	}

	return result.filePaths[0];
};

const imageLoad = async (filePath: string, addMessage: addMessageType) => {
	const loadResult = await ddClient.docker.cli.exec('load', ['-i', filePath]);

	if (loadResult.stderr) {
		addMessage(`Error loading image from file "${filePath}"`, loadResult.stderr, 'error');
		return;
	}

	// Parse loaded image name from stdout
	// Output format: "Loaded image: imagename:tag"
	const match = /Loaded image: (.+)/.exec(loadResult.stdout);
	const imageName = match ? match[1] : 'unknown';
	addMessage(`Image "${imageName}" loaded from file "${filePath}"`, '', 'success');
};

export const App = () => {
	const [operationDialogOpen, setOperationDialogOpen] = React.useState(false);
	const [operationDialogDescription, setOperationDialogDescription] = React.useState('');
	const {addMessage} = useLogger();
	const [value, setValue] = React.useState(0);
	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};
	const {containers, images, loadDockerData} = useDockerData(ddClient);

	const handleLoadImage = async () => {
		const filePath = await openDialog();
		if (filePath) {
			setOperationDialogDescription(`Load image from file "${filePath}"`);
			setOperationDialogOpen(true);
			await imageLoad(filePath, addMessage);
			await loadDockerData();
			setOperationDialogOpen(false);
		}
	};

	// Add to component
	React.useEffect(() => {
		if (!operationDialogOpen) {
			return;
		}

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [operationDialogOpen]);

	return (
		<AppContextProvider ddClient={ddClient}>
			<Box sx={{width: '100%'}}>
				<Box sx={{borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
					<Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
						<Tab label="Container" {...a11yProps(0)} />
						<Tab label="Images" {...a11yProps(1)} />
						<Tab label="Logging" {...a11yProps(2)} />
					</Tabs>
					<Box sx={{ml: 2}}>
						<ActionIconButton
							title="Load image"
							size="medium"
							icon={<UploadIcon />}
							aria-label="load"
							onClick={() => {
								void handleLoadImage();
							}}
						/>
						<ActionIconButton
							title="Refresh"
							size="medium"
							icon={<RefreshIcon />}
							aria-label="refresh"
							onClick={() => {
								void loadDockerData();
							}}
						/>
					</Box>
				</Box>
				<CustomTabPanel value={value} index={0}>
					<Containers
						containers={containers}
						images={images}
						ddClient={ddClient}
						setOperationDialogOpen={setOperationDialogOpen}
						setOperationDialogDescription={setOperationDialogDescription}
						refresh={loadDockerData}
					/>
				</CustomTabPanel>
				<CustomTabPanel value={value} index={1}>
					<Images
						images={images}
						ddClient={ddClient}
						setOperationDialogOpen={setOperationDialogOpen}
						setOperationDialogDescription={setOperationDialogDescription}
						refresh={loadDockerData}
					/>
				</CustomTabPanel>
				<CustomTabPanel value={value} index={2}>
					<Logging />
				</CustomTabPanel>
			</Box>
			<OperationDialog isOpen={operationDialogOpen} description={operationDialogDescription} />
		</AppContextProvider>
	);
};
