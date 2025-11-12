import { TabConfig } from '@/shared/types/tabs';
import ParamsTab from '@/components/request-tabs/ParamsTab';
import HeadersTab from '@/components/request-tabs/HeadersTab';
import AuthTab from '@/components/request-tabs/AuthTab';
import BodyTab from '@/components/request-tabs/BodyTab';
import { CookieManager } from '@/components/cookie/cookie-manager';
import PreRequestScriptTab from '@/components/request-tabs/PreRequestScriptTab';
import SettingsTab from '@/components/request-tabs/SettingsTab';

export const REQUEST_TABS_CONFIG: TabConfig[] = [
	{ id: 'params', label: 'Params', component: ParamsTab, testId: 'params-tab' },
	{ id: 'headers', label: 'Headers', component: HeadersTab, testId: 'headers-tab' },
	{ id: 'auth', label: 'Authorization', component: AuthTab, testId: 'auth-tab' },
	{ id: 'body', label: 'Body', component: BodyTab, testId: 'body-tab' },
	{ id: 'cookies', label: 'Cookies', component: CookieManager, testId: 'cookies-tab' },
	{ id: 'pre-request', label: 'Pre-request Script', component: PreRequestScriptTab, testId: 'pre-request-tab' },
	{ id: 'settings', label: 'Settings', component: SettingsTab, testId: 'settings-tab' },
];

export const RESPONSE_TABS_CONFIG: TabConfig[] = [
	{ id: 'body', label: 'Body', component: BodyTab, testId: 'response-body-tab' },
	{ id: 'headers', label: 'Headers', component: HeadersTab, testId: 'response-headers-tab' },
	{ id: 'cookies', label: 'Cookies', component: CookieManager, testId: 'response-cookies-tab' },
	{ id: 'timeline', label: 'Timeline', component: SettingsTab, testId: 'response-timeline-tab' },
];
