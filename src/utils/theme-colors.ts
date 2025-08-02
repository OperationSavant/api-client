/**
 * VS Code theme-compliant color utilities
 * ONLY uses VS Code CSS variables - NO hardcoded colors
 */

export const getMethodStatusColor = (method: string): string => {
	// Only use VS Code semantic colors
	const colors = {
		GET: 'text-foreground',
		POST: 'text-foreground', 
		PUT: 'text-foreground',
		DELETE: 'text-destructive',
		PATCH: 'text-foreground',
		HEAD: 'text-muted-foreground',
		OPTIONS: 'text-foreground'
	};
	return colors[method as keyof typeof colors] || 'text-muted-foreground';
};

export const getMethodBadgeColor = (method: string): string => {
	// Only VS Code semantic colors with proper backgrounds
	const colors = {
		GET: 'bg-accent text-accent-foreground border-border',
		POST: 'bg-primary text-primary-foreground border-border',
		PUT: 'bg-secondary text-secondary-foreground border-border',
		DELETE: 'bg-destructive/10 text-destructive border-border',
		PATCH: 'bg-accent text-accent-foreground border-border',
		HEAD: 'bg-muted text-muted-foreground border-border',
		OPTIONS: 'bg-secondary text-secondary-foreground border-border'
	};
	return colors[method as keyof typeof colors] || 'bg-muted text-muted-foreground border-border';
};

export const getStatusCodeColor = (status: number): string => {
	// Only VS Code semantic colors
	if (status >= 200 && status < 300) {
		return 'bg-accent text-accent-foreground border-border';
	}
	if (status >= 300 && status < 400) {
		return 'bg-secondary text-secondary-foreground border-border';
	}
	if (status >= 400 && status < 500) {
		return 'bg-destructive/10 text-destructive border-border';
	}
	if (status >= 500) {
		return 'bg-destructive text-destructive-foreground border-border';
	}
	return 'bg-muted text-muted-foreground border-border';
};

export const getVariableTypeColor = (type: 'secret' | 'text'): string => {
	return type === 'secret' 
		? 'bg-destructive/10 text-destructive border-border'
		: 'bg-accent text-accent-foreground border-border';
};

export const getScopeColor = (scope: 'global' | 'collection' | 'request'): string => {
	const colors = {
		global: 'bg-primary text-primary-foreground border-border',
		collection: 'bg-secondary text-secondary-foreground border-border',
		request: 'bg-accent text-accent-foreground border-border'
	};
	return colors[scope] || 'bg-muted text-muted-foreground border-border';
};
