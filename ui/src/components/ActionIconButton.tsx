import React from 'react';
import {Tooltip, IconButton, CircularProgress, IconButtonProps} from '@mui/material';

interface ActionIconButtonProps {
	title: string;
	color?: 'primary' | 'secondary';
	icon: React.ReactNode;
	loading?: boolean;
	disabled?: boolean;
	onClick: () => void;
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
