import {useLogger} from '../context/LoggingContext';
import {type dockerDesktopClientType} from '../utilties/docker';
import {Paper, Button} from '@mui/material';

type Props = {
	ddClient: dockerDesktopClientType;
};

// eslint-disable-next-line react/prop-types, @typescript-eslint/no-unused-vars
export const Test: React.FC<Props> = ({ddClient}) => {
	const {addMessage} = useLogger();

	const handleTest = () => {
		addMessage('handleTest', '', 'log');
	};

	return (
		<Paper
			sx={{
				mt: 2,
				borderRadius: 2,
				boxShadow: 3,
				display: 'flex',
				justifyContent: 'center',
				p: 2,
			}}
		>
			<Button variant="contained" color="primary" onClick={handleTest}>
				Test
			</Button>
		</Paper>
	);
};
