import React, {useState} from 'react';
import {Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button} from '@mui/material';

type PromptDialogProps = {
	open: boolean;
	title: string;
	label?: string;
	defaultValue?: string;
	onClose: (value: string | null) => void;
};

export const PromptDialog: React.FC<PromptDialogProps> = ({open, title, label = 'Enter value', defaultValue = '', onClose}) => {
	const [value, setValue] = useState<string>(defaultValue);

	const handleCancel = (): void => onClose(null);
	const handleOk = (): void => onClose(value);

	return (
		<Dialog open={open} onClose={handleCancel} fullWidth maxWidth="xs">
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>
				<TextField autoFocus margin="dense" label={label} type="text" fullWidth variant="standard" value={value} onChange={(e) => setValue(e.target.value)} />
			</DialogContent>
			<DialogActions>
				<Button onClick={handleCancel}>Cancel</Button>
				<Button onClick={handleOk} variant="contained">
					OK
				</Button>
			</DialogActions>
		</Dialog>
	);
};
