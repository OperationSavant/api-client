// import { useCallback, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import { RootState, useAppDispatch } from '@/store';
// import { cookieService } from '@/services/cookie-service';
// import { Cookie, CookieImportExport } from '@/shared/types/cookie';
// import {
// 	setCookies,
// 	addCookie as addCookieAction,
// 	updateCookie as updateCookieAction,
// 	deleteCookie as deleteCookieAction,
// 	clearAllCookies as clearAllCookiesAction,
// } from '@/features/cookies/cookiesSlice';

// export const useCookieOperations = () => {
// 	const dispatch = useAppDispatch();

// 	const cookies = useSelector((state: RootState) => state.cookies.items);

// 	useEffect(() => {
// 		const loadedCookies = cookieService.getAllCookies();
// 		dispatch(setCookies(loadedCookies));
// 	}, [dispatch]);

// 	const addCookie = useCallback(
// 		(cookie: Omit<Cookie, 'created' | 'lastAccessed'>) => {
// 			const newCookie: Cookie = {
// 				...cookie,
// 				created: new Date(),
// 				lastAccessed: new Date(),
// 			};
// 			cookieService.addCookie(newCookie);
// 			dispatch(addCookieAction(newCookie));
// 		},
// 		[dispatch]
// 	);

// 	const updateCookie = useCallback(
// 		(name: string, domain: string, path: string, updates: Partial<Cookie>) => {
// 			const existingCookie = cookieService.getAllCookies().find(c => c.name === name && c.domain === domain && c.path === path);

// 			if (existingCookie) {
// 				const updatedCookie = { ...existingCookie, ...updates };
// 				cookieService.addCookie(updatedCookie);
// 				dispatch(updateCookieAction({ name, domain, path, updates }));
// 			}
// 		},
// 		[dispatch]
// 	);

// 	const deleteCookie = useCallback(
// 		(name: string, domain: string, path: string) => {
// 			const cookie = cookieService.getAllCookies().find(c => c.name === name && c.domain === domain && c.path === path);
// 			if (cookie) {
// 				cookieService.deleteCookie(cookie);
// 				dispatch(deleteCookieAction({ name, domain, path }));
// 			}
// 		},
// 		[dispatch]
// 	);

// 	const deleteAllCookies = useCallback(() => {
// 		cookieService.clearAll();
// 		dispatch(clearAllCookiesAction());
// 	}, [dispatch]);

// 	const importCookies = useCallback(
// 		(cookies: Cookie[]) => {
// 			cookies.forEach(cookie => cookieService.addCookie(cookie));
// 			const allCookies = cookieService.getAllCookies();
// 			dispatch(setCookies(allCookies));
// 		},
// 		[dispatch]
// 	);

// 	const exportCookies = useCallback((exportConfig: CookieImportExport) => {
// 		const exported = cookieService.exportCookies(exportConfig.format);
// 		console.log('Exported cookies:', exported);
// 		// TODO: Trigger file download if needed in future
// 		return exported;
// 	}, []);

// 	return {
// 		cookies,
// 		addCookie,
// 		updateCookie,
// 		deleteCookie,
// 		deleteAllCookies,
// 		importCookies,
// 		exportCookies,
// 	};
// };
