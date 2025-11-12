import {Dialog, DialogContent, DialogTitle, CircularProgress, Alert, Box, Typography} from '@mui/material';

type OperationDialogProps = {
	readonly isOpen: boolean;
	readonly description: string;
};

export const OperationDialog = ({isOpen, description}: OperationDialogProps) => {
	return (
		<Dialog open={isOpen} disableEscapeKeyDown maxWidth="md" fullWidth>
			<DialogTitle>Operation in Progress</DialogTitle>
			<DialogContent>
				<Box display="flex" alignItems="center" gap={2} mb={2}>
					<CircularProgress />
					<Typography>{description}</Typography>
				</Box>
				<Alert severity="warning">Do not leave this extension. Doing so will interrupt the operation.</Alert>
			</DialogContent>
		</Dialog>
	);
};
