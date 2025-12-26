import type { TabConfig } from '@/shared/types/tabs';
import ParamsTab from '@/components/request-tabs/ParamsTab';
import HeadersTab from '@/components/request-tabs/HeadersTab';
import AuthTab from '@/components/request-tabs/AuthTab';
import BodyTab from '@/components/request-tabs/BodyTab';
import PreRequestScriptTab from '@/components/request-tabs/PreRequestScriptTab';
import SettingsTab from '@/components/request-tabs/SettingsTab';
import { AlignStartVertical, BookOpen, Code, Lock, Settings, SlidersHorizontal, TextSelect } from 'lucide-react';

export const REQUEST_TABS_CONFIG: TabConfig[] = [
	{ id: 'params', label: 'Params', component: ParamsTab, testId: 'params-tab', icon: SlidersHorizontal },
	{ id: 'headers', label: 'Headers', component: HeadersTab, testId: 'headers-tab', icon: AlignStartVertical },
	{ id: 'auth', label: 'Authorization', component: AuthTab, testId: 'auth-tab', icon: Lock },
	{ id: 'body', label: 'Body', component: BodyTab, testId: 'body-tab', icon: TextSelect },
	{ id: 'doc', label: 'Document', component: undefined, testId: 'cookies-tab', icon: BookOpen },
	{ id: 'scripts', label: 'Scripts', component: PreRequestScriptTab, testId: 'pre-request-tab', icon: Code },
	{ id: 'settings', label: 'Settings', component: SettingsTab, testId: 'settings-tab', icon: Settings },
];

// export const RESPONSE_TABS_CONFIG: TabConfig[] = [
// 	{ id: 'body', label: 'Body', component: BodyTab, testId: 'response-body-tab' },
// 	{ id: 'headers', label: 'Headers', component: HeadersTab, testId: 'response-headers-tab' },
// 	{ id: 'cookies', label: 'Cookies', component: CookieManager, testId: 'response-cookies-tab' },
// 	{ id: 'timeline', label: 'Timeline', component: SettingsTab, testId: 'response-timeline-tab' },
// ];
