import React from 'react';
import {Tooltip, IconButton, CircularProgress, type IconButtonProps} from '@mui/material';

interface ActionIconButtonProps {
	readonly title: string;
	readonly size?: IconButtonProps['size'];
	readonly color?: IconButtonProps['color'];
	readonly icon: React.ReactNode;
	readonly loading?: boolean;
	readonly disabled?: boolean;
	readonly ariaLabel?: string;
	readonly onClick: () => void;
}

/**
 * Generic reusable icon button with loading spinner and tooltip.
 */
export const ActionIconButton: React.FC<ActionIconButtonProps> = ({
	title,
	size = 'medium',
	color = 'primary',
	icon,
	loading = false,
	disabled = false,
	ariaLabel = '',
	onClick,
}) => {
	return (
		<Tooltip title={title}>
			<span>
				<IconButton size={size} color={color} disabled={disabled || loading} aria-label={ariaLabel} onClick={onClick}>
					{loading ? <CircularProgress size={18} thickness={5} /> : icon}
				</IconButton>
			</span>
		</Tooltip>
	);
};
