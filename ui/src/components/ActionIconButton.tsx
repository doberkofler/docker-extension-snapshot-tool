import React from 'react';
import {Tooltip, IconButton, CircularProgress} from '@mui/material';

interface ActionIconButtonProps {
	readonly title: string;
	readonly color?: 'primary' | 'secondary';
	readonly icon: React.ReactNode;
	readonly loading?: boolean;
	readonly disabled?: boolean;
	readonly onClick: () => void;
}

/**
 * Generic reusable icon button with loading spinner and tooltip.
 */
export const ActionIconButton: React.FC<ActionIconButtonProps> = ({title, color = 'primary', icon, loading = false, disabled = false, onClick}) => {
	return (
		<Tooltip title={title}>
			<span>
				<IconButton size="small" color={color} disabled={disabled || loading} onClick={onClick}>
					{loading ? <CircularProgress size={18} color={color} thickness={5} /> : icon}
				</IconButton>
			</span>
		</Tooltip>
	);
};
