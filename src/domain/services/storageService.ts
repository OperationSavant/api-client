// import { ExtensionContext } from 'vscode';

// const STATE_KEY = 'apiClientState';

// export class StorageService {
// 	private context: ExtensionContext | null = null;

// 	public initialize(context: ExtensionContext): void {
// 		this.context = context;
// 	}

// 	public saveState(data: any): void {
// 		if (!this.context) {
// 			console.error('StorageService not initialized!');
// 			return;
// 		}
// 		this.context.workspaceState.update(STATE_KEY, data);
// 	}

// 	public loadState(): any | undefined {
// 		if (!this.context) {
// 			console.error('StorageService not initialized!');
// 			return undefined;
// 		}
// 		return this.context.workspaceState.get(STATE_KEY);
// 	}
// }

// export const storageService = new StorageService();
