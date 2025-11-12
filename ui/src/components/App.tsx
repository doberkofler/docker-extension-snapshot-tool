import * as React from 'react';
import {Tabs, Tab, Box, IconButton} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {createDockerDesktopClient} from '@docker/extension-api-client';
import {useDockerData} from '../hooks/useDockerData';
import {Containers} from './Containers';
import {Images} from './Images';
import {AppContextProvider} from '../context/AppContext';
import {Logging} from './Logging';
//import {Test} from './Test';

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

export const App = () => {
	const [value, setValue] = React.useState(0);
	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};
	const {containers, images, loadDockerData} = useDockerData(ddClient);

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
						<IconButton
							aria-label="refresh"
							onClick={() => {
								void loadDockerData();
							}}
						>
							<RefreshIcon />
						</IconButton>
					</Box>
				</Box>
				<CustomTabPanel value={value} index={0}>
					<Containers containers={containers} images={images} ddClient={ddClient} refresh={loadDockerData} />
				</CustomTabPanel>
				<CustomTabPanel value={value} index={1}>
					<Images images={images} ddClient={ddClient} refresh={loadDockerData} />
				</CustomTabPanel>
				<CustomTabPanel value={value} index={2}>
					<Logging />
				</CustomTabPanel>
			</Box>
		</AppContextProvider>
	);
};
