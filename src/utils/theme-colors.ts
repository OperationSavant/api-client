/**
 * VS Code theme-compliant color utilities
 * Uses semantic colors that adapt to VS Code themes
 */

export const getMethodStatusColor = (method: string): string => {
	const colors = {
		GET: 'text-green-600 dark:text-green-400',
		POST: 'text-blue-600 dark:text-blue-400', 
		PUT: 'text-orange-600 dark:text-orange-400',
		DELETE: 'text-red-600 dark:text-red-400',
		PATCH: 'text-purple-600 dark:text-purple-400',
		HEAD: 'text-muted-foreground',
		OPTIONS: 'text-cyan-600 dark:text-cyan-400'
	};
	return colors[method as keyof typeof colors] || 'text-muted-foreground';
};

export const getMethodBadgeColor = (method: string): string => {
	const colors = {
		GET: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
		POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
		PUT: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
		DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
		PATCH: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
		HEAD: 'bg-muted text-muted-foreground border-border',
		OPTIONS: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
	};
	return colors[method as keyof typeof colors] || 'bg-muted text-muted-foreground border-border';
};

export const getStatusCodeColor = (status: number): string => {
	if (status >= 200 && status < 300) {
		return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
	}
	if (status >= 300 && status < 400) {
		return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
	}
	if (status >= 400 && status < 500) {
		return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
	}
	if (status >= 500) {
		return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
	}
	return 'bg-muted text-muted-foreground border-border';
};

export const getVariableTypeColor = (type: 'secret' | 'text'): string => {
	return type === 'secret' 
		? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
		: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
};

export const getScopeColor = (scope: 'global' | 'collection' | 'request'): string => {
	const colors = {
		global: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
		collection: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
		request: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
	};
	return colors[scope] || 'bg-muted text-muted-foreground border-border';
};
