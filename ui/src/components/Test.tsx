import {useLogger} from '../context/LoggingContext';
import {type dockerDesktopClientType} from '../docker';
import {errorToString} from '../errorToString';
import {Paper, Button} from '@mui/material';

type Props = {
	ddClient: dockerDesktopClientType;
};

export const Test: React.FC<Props> = ({ddClient}) => {
	const {addMessage} = useLogger();

	const handleTest = async (): Promise<void> => {
		addMessage('Start test', '', 'log');
		try {
			addMessage(
				'ddClient',
				JSON.stringify({
					hasExtension: !!ddClient.extension,
					hasVm: !!ddClient.extension?.vm,
					hasService: !!ddClient.extension?.vm?.service,
				}),
				'log',
			);
			const result = await ddClient.extension.vm?.service?.get('/images');
			addMessage('hello', JSON.stringify(result), 'log');
		} catch (error) {
			addMessage('test error', errorToString(error), 'error');
		}
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
