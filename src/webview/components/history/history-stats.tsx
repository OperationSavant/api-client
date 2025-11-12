// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
// import { BarChart3, TrendingUp, Clock, CheckCircle, XCircle, Activity, Globe, Calendar } from 'lucide-react';
// import { HistoryStatistics, HistoryFilter } from '@/shared/types/history';
// import { historyService } from '@/services/history-service';

// interface HistoryStatsProps {
// 	filter?: HistoryFilter;
// 	refreshTrigger?: number;
// }

// export const HistoryStats: React.FC<HistoryStatsProps> = ({ filter, refreshTrigger = 0 }) => {
// 	const [stats, setStats] = useState<HistoryStatistics | null>(null);

// 	useEffect(() => {
// 		loadStats();
// 	}, [filter, refreshTrigger]);

// 	const loadStats = () => {
// 		const statistics = historyService.getStatistics(filter);
// 		setStats(statistics);
// 	};

// 	const getSuccessRate = () => {
// 		if (!stats || stats.totalRequests === 0) return 0;
// 		return Math.round((stats.successfulRequests / stats.totalRequests) * 100);
// 	};

// 	const getMethodColorClass = (method: string) => {
// 		const colors = {
// 			GET: 'bg-green-500',
// 			POST: 'bg-blue-500',
// 			PUT: 'bg-orange-500',
// 			DELETE: 'bg-red-500',
// 			PATCH: 'bg-purple-500',
// 			HEAD: 'bg-gray-500',
// 			OPTIONS: 'bg-indigo-500',
// 		};
// 		return colors[method as keyof typeof colors] || 'bg-muted';
// 	};

// 	if (!stats) {
// 		return (
// 			<Card className='border-border bg-card text-card-foreground'>
// 				<CardContent className='p-6'>
// 					<div className='text-center text-muted-foreground'>Loading statistics...</div>
// 				</CardContent>
// 			</Card>
// 		);
// 	}

// 	return (
// 		<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
// 			{/* Overview Stats */}
// 			<Card className='border-border bg-card text-card-foreground'>
// 				<CardHeader>
// 					<CardTitle className='text-lg font-semibold text-foreground flex items-center gap-2'>
// 						<BarChart3 className='h-5 w-5' />
// 						Overview
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent className='space-y-4'>
// 					<div className='grid grid-cols-2 gap-4'>
// 						<div className='text-center'>
// 							<div className='text-2xl font-bold text-foreground'>{stats.totalRequests}</div>
// 							<div className='text-sm text-muted-foreground'>Total Requests</div>
// 						</div>
// 						<div className='text-center'>
// 							<div className='text-2xl font-bold text-green-600 dark:text-green-400'>{getSuccessRate()}%</div>
// 							<div className='text-sm text-muted-foreground'>Success Rate</div>
// 						</div>
// 					</div>

// 					<div className='space-y-2'>
// 						<div className='flex justify-between text-sm'>
// 							<span className='text-muted-foreground'>Success</span>
// 							<span className='text-foreground'>{stats.successfulRequests}</span>
// 						</div>
// 						<Progress value={getSuccessRate()} className='h-2 bg-muted' />
// 					</div>

// 					<div className='grid grid-cols-2 gap-4 text-sm'>
// 						<div className='flex items-center gap-2'>
// 							<CheckCircle className='h-4 w-4 text-green-500' />
// 							<span className='text-muted-foreground'>Success:</span>
// 							<span className='text-foreground'>{stats.successfulRequests}</span>
// 						</div>
// 						<div className='flex items-center gap-2'>
// 							<XCircle className='h-4 w-4 text-red-500' />
// 							<span className='text-muted-foreground'>Failed:</span>
// 							<span className='text-foreground'>{stats.failedRequests}</span>
// 						</div>
// 					</div>

// 					{stats.averageResponseTime > 0 && (
// 						<div className='flex items-center gap-2 text-sm'>
// 							<Clock className='h-4 w-4 text-blue-500' />
// 							<span className='text-muted-foreground'>Avg Response Time:</span>
// 							<span className='text-foreground'>{Math.round(stats.averageResponseTime)}ms</span>
// 						</div>
// 					)}
// 				</CardContent>
// 			</Card>

// 			{/* Method Distribution */}
// 			<Card className='border-border bg-card text-card-foreground'>
// 				<CardHeader>
// 					<CardTitle className='text-lg font-semibold text-foreground flex items-center gap-2'>
// 						<Activity className='h-5 w-5' />
// 						HTTP Methods
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					{Object.keys(stats.methodDistribution).length === 0 ? (
// 						<div className='text-center text-muted-foreground py-4'>No data available</div>
// 					) : (
// 						<div className='space-y-3'>
// 							{Object.entries(stats.methodDistribution)
// 								.sort(([, a], [, b]) => b - a)
// 								.map(([method, count]) => {
// 									const percentage = Math.round((count / stats.totalRequests) * 100);
// 									return (
// 										<div key={method} className='space-y-1'>
// 											<div className='flex justify-between items-center text-sm'>
// 												<div className='flex items-center gap-2'>
// 													<div className={`w-3 h-3 rounded ${getMethodColorClass(method)}`} />
// 													<span className='text-foreground'>{method}</span>
// 												</div>
// 												<div className='flex items-center gap-2'>
// 													<span className='text-muted-foreground'>{count}</span>
// 													<Badge variant='secondary' className='text-xs'>
// 														{percentage}%
// 													</Badge>
// 												</div>
// 											</div>
// 											<Progress value={percentage} className='h-1.5 bg-muted' />
// 										</div>
// 									);
// 								})}
// 						</div>
// 					)}
// 				</CardContent>
// 			</Card>

// 			{/* Status Distribution */}
// 			<Card className='border-border bg-card text-card-foreground'>
// 				<CardHeader>
// 					<CardTitle className='text-lg font-semibold text-foreground flex items-center gap-2'>
// 						<TrendingUp className='h-5 w-5' />
// 						Status Codes
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					{Object.keys(stats.statusDistribution).length === 0 ? (
// 						<div className='text-center text-muted-foreground py-4'>No data available</div>
// 					) : (
// 						<div className='space-y-3'>
// 							{Object.entries(stats.statusDistribution)
// 								.sort(([, a], [, b]) => b - a)
// 								.map(([statusGroup, count]) => {
// 									const percentage = Math.round((count / stats.totalRequests) * 100);
// 									const getStatusColor = () => {
// 										if (statusGroup.startsWith('2')) return 'bg-green-500';
// 										if (statusGroup.startsWith('4')) return 'bg-yellow-500';
// 										if (statusGroup.startsWith('5')) return 'bg-red-500';
// 										return 'bg-blue-500';
// 									};

// 									return (
// 										<div key={statusGroup} className='space-y-1'>
// 											<div className='flex justify-between items-center text-sm'>
// 												<div className='flex items-center gap-2'>
// 													<div className={`w-3 h-3 rounded ${getStatusColor()}`} />
// 													<span className='text-foreground'>{statusGroup}</span>
// 												</div>
// 												<div className='flex items-center gap-2'>
// 													<span className='text-muted-foreground'>{count}</span>
// 													<Badge variant='secondary' className='text-xs'>
// 														{percentage}%
// 													</Badge>
// 												</div>
// 											</div>
// 											<Progress value={percentage} className='h-1.5 bg-muted' />
// 										</div>
// 									);
// 								})}
// 						</div>
// 					)}
// 				</CardContent>
// 			</Card>

// 			{/* Most Used URLs */}
// 			<Card className='border-border bg-card text-card-foreground'>
// 				<CardHeader>
// 					<CardTitle className='text-lg font-semibold text-foreground flex items-center gap-2'>
// 						<Globe className='h-5 w-5' />
// 						Most Used URLs
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					{stats.mostUsedUrls.length === 0 ? (
// 						<div className='text-center text-muted-foreground py-4'>No data available</div>
// 					) : (
// 						<div className='space-y-3'>
// 							{stats.mostUsedUrls.slice(0, 5).map((urlData, index) => (
// 								<div key={urlData.url} className='space-y-1'>
// 									<div className='flex justify-between items-start text-sm'>
// 										<div className='flex-1 min-w-0'>
// 											<span className='text-foreground truncate block' title={urlData.url}>
// 												{index + 1}. {urlData.url}
// 											</span>
// 										</div>
// 										<Badge variant='secondary' className='text-xs ml-2'>
// 											{urlData.count}
// 										</Badge>
// 									</div>
// 								</div>
// 							))}
// 						</div>
// 					)}
// 				</CardContent>
// 			</Card>

// 			{/* Recent Activity */}
// 			<Card className='border-border bg-card text-card-foreground lg:col-span-2'>
// 				<CardHeader>
// 					<CardTitle className='text-lg font-semibold text-foreground flex items-center gap-2'>
// 						<Calendar className='h-5 w-5' />
// 						Recent Activity (Last 7 Days)
// 					</CardTitle>
// 				</CardHeader>
// 				<CardContent>
// 					{stats.recentActivity.length === 0 ? (
// 						<div className='text-center text-muted-foreground py-4'>No data available</div>
// 					) : (
// 						<div className='grid grid-cols-7 gap-2'>
// 							{stats.recentActivity.map(dayData => {
// 								const maxCount = Math.max(...stats.recentActivity.map(d => d.count));
// 								const height = maxCount === 0 ? 0 : Math.max(20, (dayData.count / maxCount) * 60);
// 								const date = new Date(dayData.date);

// 								return (
// 									<div key={dayData.date} className='text-center'>
// 										<div
// 											className='bg-primary/20 rounded mb-1 mx-auto transition-all hover:bg-primary/30'
// 											style={{ height: `${height}px`, width: '100%' }}
// 											title={`${date.toLocaleDateString()}: ${dayData.count} requests`}
// 										/>
// 										<div className='text-xs text-muted-foreground'>{date.toLocaleDateString('en', { weekday: 'short' })}</div>
// 										<div className='text-xs text-foreground font-medium'>{dayData.count}</div>
// 									</div>
// 								);
// 							})}
// 						</div>
// 					)}
// 				</CardContent>
// 			</Card>
// 		</div>
// 	);
// };

// export default HistoryStats;
