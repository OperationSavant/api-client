const getStatusColor = (status?: number) => {
	if (!status) return 'bg-muted text-muted-foreground';
	if (status >= 200 && status < 300) return 'bg-green-500/20 text-green-600 dark:text-green-400';
	if (status >= 400 && status < 500) return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
	if (status >= 500) return 'bg-red-500/20 text-red-600 dark:text-red-400';
	return 'bg-blue-500/20 text-blue-600 dark:text-blue-400';
};

const getMethodColor = (method: string) => {
	const colors = {
		GET: 'bg-green-500/20 text-green-600 dark:text-green-400',
		POST: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
		PUT: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
		DELETE: 'bg-red-500/20 text-red-600 dark:text-red-400',
		PATCH: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
		HEAD: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
		OPTIONS: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
	};
	return colors[method as keyof typeof colors] || 'bg-muted text-muted-foreground';
};

const formatDate = (date: Date) => {
	const now = new Date();
	const diffMs = now.getTime() - new Date(date).getTime();
	const diffHours = diffMs / (1000 * 60 * 60);
	const diffDays = diffMs / (1000 * 60 * 60 * 24);

	if (diffHours < 1) {
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		return `${diffMinutes}m ago`;
	} else if (diffHours < 24) {
		return `${Math.floor(diffHours)}h ago`;
	} else if (diffDays < 7) {
		return `${Math.floor(diffDays)}d ago`;
	} else {
		return new Date(date).toLocaleDateString();
	}
};

export { getStatusColor, getMethodColor, formatDate };
