import {useLogger} from '../context/LoggingContext';
import {type dockerDesktopClientType, dockerGet} from '../utilties/docker';
import {errorToString} from '../utilties/errorToString';
import {Paper, Button} from '@mui/material';

type Props = {
	ddClient: dockerDesktopClientType;
};

export const Test: React.FC<Props> = ({ddClient}) => {
	const {addMessage} = useLogger();

	const handleTest = async (): Promise<void> => {
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
