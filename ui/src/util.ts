export const formatDateForFilename = (date: Date): string => {
	const pad = (n: number): string => n.toString().padStart(2, '0');

	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hour = pad(date.getHours());
	const minute = pad(date.getMinutes());
	const second = pad(date.getSeconds());

	return `${year}${month}${day}_${hour}${minute}${second}`;
};
