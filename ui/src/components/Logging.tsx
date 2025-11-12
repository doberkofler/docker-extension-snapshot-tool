import React, {useState} from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Typography,
} from '@mui/material';
import {type LoggingMessageType, useLogger} from '../context/LoggingContext';
import {formatDate} from '../utilties/util';

type LoggingMessageDialogProps = {
	readonly open: boolean;
	readonly onClose: () => void;
	readonly message: LoggingMessageType | null;
};

const LoggingMessageDialog: React.FC<LoggingMessageDialogProps> = ({open, onClose, message}) => {
	if (!message) {
		return null;
	}

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Log Entry #{message.id}</DialogTitle>
			<DialogContent dividers>
				<Typography variant="body2" sx={{mb: 1}}>
					<b>Timestamp:</b> {formatDate(message.timestamp)}
				</Typography>
				<Typography variant="body2" sx={{mb: 1}}>
					<b>Severity:</b> {message.severity}
				</Typography>
				<Typography variant="body2" sx={{mb: 1}}>
					<b>Message:</b> {message.message}
				</Typography>
				<Typography
					variant="body2"
					sx={{
						whiteSpace: 'pre-wrap',
						maxHeight: 300,
						overflowY: 'auto',
						border: '1px solid',
						borderColor: 'divider',
						p: 1,
						mt: 1,
					}}
				>
					{message.context}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	);
};

export const Logging: React.FC = () => {
	const {messages} = useLogger();
	const [selected, setSelected] = useState<LoggingMessageType | null>(null);
	const [open, setOpen] = useState(false);
	const handleRowDoubleClick = (message: LoggingMessageType) => {
		setSelected(message);
		setOpen(true);
	};

	return (
		<>
			<LoggingMessageDialog open={open} onClose={() => setOpen(false)} message={selected} />
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
									Id
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="subtitle2" fontWeight={600}>
									Timestamp
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="subtitle2" fontWeight={600}>
									Severity
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="subtitle2" fontWeight={600}>
									Message
								</Typography>
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{messages.map((e) => {
							return (
								<TableRow key={e.id} hover onDoubleClick={() => handleRowDoubleClick(e)}>
									<TableCell
										sx={{
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											maxWidth: 50,
										}}
									>
										{e.id.toString()}
									</TableCell>
									<TableCell
										sx={{
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											maxWidth: 100,
										}}
									>
										{formatDate(e.timestamp)}
									</TableCell>
									<TableCell
										sx={{
											whiteSpace: 'nowrap',
											overflow: 'hidden',
											textOverflow: 'ellipsis',
											maxWidth: 100,
											color: e.severity === 'error' ? 'error.main' : e.severity === 'success' ? 'success.main' : 'text.primary',
											fontWeight: 600,
										}}
									>
										{e.severity}
									</TableCell>
									<TableCell>{e.message}</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>
		</>
	);
};
