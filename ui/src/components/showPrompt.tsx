import {createRoot} from 'react-dom/client';
import {PromptDialog} from './PromptDialog';

export const showPrompt = (options: {title: string; label?: string; defaultValue?: string}): Promise<string | null> => {
	return new Promise((resolve) => {
		const container = document.createElement('div');
		document.body.appendChild(container);

		const handleClose = (value: string | null): void => {
			root.unmount();
			container.remove();
			resolve(value);
		};

		const root = createRoot(container);
		root.render(<PromptDialog open title={options.title} label={options.label} defaultValue={options.defaultValue} onClose={handleClose} />);
	});
};
