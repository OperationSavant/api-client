import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, SearchIcon, CopyIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

export interface TreeNode {
	key: string;
	value: any;
	type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
	children?: TreeNode[];
	parent?: TreeNode;
	path: string[];
	isExpanded?: boolean;
	isHighlighted?: boolean;
}

export interface ResponseTreeViewProps {
	data: string;
	contentType: 'json' | 'xml';
	searchable?: boolean;
	copyable?: boolean;
	className?: string;
	onNodeSelect?: (node: TreeNode) => void;
	onNodeCopy?: (node: TreeNode, value: string) => void;
}

interface TreeNodeComponentProps {
	node: TreeNode;
	depth: number;
	onToggle: (node: TreeNode) => void;
	onCopy: (node: TreeNode) => void;
	searchTerm: string;
}

export const ResponseTreeView: React.FC<ResponseTreeViewProps> = ({
	data,
	contentType,
	searchable = true,
	copyable = true,
	className = '',
	onNodeSelect,
	onNodeCopy,
}) => {
	const [rootNode, setRootNode] = useState<TreeNode | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
	const [error, setError] = useState<string | null>(null);

	// Parse data and create tree structure
	useEffect(() => {
		try {
			setError(null);
			let parsedData: any;

			if (contentType === 'json') {
				parsedData = JSON.parse(data);
			} else if (contentType === 'xml') {
				// For XML, we'll convert it to a JSON-like structure
				parsedData = parseXmlToTree(data);
			} else {
				throw new Error('Unsupported content type');
			}

			const tree = createTreeFromData(parsedData, [], 'root');
			setRootNode(tree);

			// Auto-expand first level
			if (tree.children) {
				const firstLevelPaths = tree.children.map(child => child.path.join('.'));
				setExpandedNodes(new Set(firstLevelPaths));
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to parse data');
			setRootNode(null);
		}
	}, [data, contentType]);

	// Create tree structure from parsed data
	const createTreeFromData = (value: any, path: string[], key: string, parent?: TreeNode): TreeNode => {
		const getType = (val: any): TreeNode['type'] => {
			if (val === null) return 'null';
			if (Array.isArray(val)) return 'array';
			if (typeof val === 'object') return 'object';
			return typeof val as TreeNode['type'];
		};

		const node: TreeNode = {
			key,
			value,
			type: getType(value),
			path,
			parent,
			isExpanded: false,
		};

		if (node.type === 'object' && value !== null) {
			node.children = Object.entries(value).map(([childKey, childValue]) => createTreeFromData(childValue, [...path, childKey], childKey, node));
		} else if (node.type === 'array') {
			node.children = value.map((childValue: any, index: number) => createTreeFromData(childValue, [...path, index.toString()], `[${index}]`, node));
		}

		return node;
	};

	// Simple XML to tree parser
	const parseXmlToTree = (xmlString: string): any => {
		// This is a simplified XML parser
		// In a real implementation, you'd use DOMParser or a proper XML library
		try {
			const parser = new DOMParser();
			const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

			const parseError = xmlDoc.querySelector('parsererror');
			if (parseError) {
				throw new Error('Invalid XML');
			}

			return xmlNodeToObject(xmlDoc.documentElement);
		} catch (error) {
			throw new Error('Failed to parse XML');
		}
	};

	const xmlNodeToObject = (node: Element): any => {
		const result: any = {};

		// Add attributes
		if (node.attributes.length > 0) {
			result['@attributes'] = {};
			Array.from(node.attributes).forEach(attr => {
				result['@attributes'][attr.name] = attr.value;
			});
		}

		// Add child nodes
		const children = Array.from(node.children);
		if (children.length === 0) {
			// Text content
			const textContent = node.textContent?.trim();
			return textContent || null;
		}

		children.forEach(child => {
			const childName = child.tagName;
			const childValue = xmlNodeToObject(child);

			if (result[childName]) {
				// Multiple children with same name - convert to array
				if (!Array.isArray(result[childName])) {
					result[childName] = [result[childName]];
				}
				result[childName].push(childValue);
			} else {
				result[childName] = childValue;
			}
		});

		return result;
	};

	// Filter nodes based on search term
	const filteredTree = useMemo(() => {
		if (!rootNode || !searchTerm) return rootNode;

		const highlightMatches = (node: TreeNode): TreeNode => {
			const isMatch =
				node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(typeof node.value === 'string' && node.value.toLowerCase().includes(searchTerm.toLowerCase()));

			const newNode: TreeNode = {
				...node,
				isHighlighted: isMatch,
				children: node.children
					?.map(highlightMatches)
					.filter(child => child.isHighlighted || (child.children && child.children.some(grandchild => grandchild.isHighlighted))),
			};

			return newNode;
		};

		return highlightMatches(rootNode);
	}, [rootNode, searchTerm]);

	const handleToggleNode = (node: TreeNode) => {
		const pathKey = node.path.join('.');
		const newExpanded = new Set(expandedNodes);

		if (newExpanded.has(pathKey)) {
			newExpanded.delete(pathKey);
		} else {
			newExpanded.add(pathKey);
		}

		setExpandedNodes(newExpanded);
		onNodeSelect?.(node);
	};

	const handleCopyNode = (node: TreeNode) => {
		const valueToString = (value: any): string => {
			if (typeof value === 'string') return value;
			if (value === null) return 'null';
			if (typeof value === 'object') return JSON.stringify(value, null, 2);
			return String(value);
		};

		const stringValue = valueToString(node.value);
		navigator.clipboard.writeText(stringValue);
		onNodeCopy?.(node, stringValue);
	};

	const getTypeColor = (type: TreeNode['type']): string => {
		switch (type) {
			case 'string':
				return 'text-green-600 dark:text-green-400';
			case 'number':
				return 'text-blue-600 dark:text-blue-400';
			case 'boolean':
				return 'text-purple-600 dark:text-purple-400';
			case 'null':
				return 'text-gray-500 dark:text-gray-400';
			case 'object':
				return 'text-yellow-600 dark:text-yellow-400';
			case 'array':
				return 'text-orange-600 dark:text-orange-400';
			default:
				return 'text-gray-700 dark:text-gray-300';
		}
	};

	const formatValue = (value: any, type: TreeNode['type']): string => {
		if (type === 'string') return `"${value}"`;
		if (type === 'null') return 'null';
		if (type === 'object') return value === null ? 'null' : '{ ... }';
		if (type === 'array') return `[ ${value.length} items ]`;
		return String(value);
	};

	const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ node, depth, onToggle, onCopy, searchTerm }) => {
		const hasChildren = node.children && node.children.length > 0;
		const isExpanded = expandedNodes.has(node.path.join('.'));
		const indentSize = depth * 20;

		return (
			<div className='select-none'>
				<div
					className={cn('flex items-center py-1 px-2 rounded hover:bg-muted/50 cursor-pointer', node.isHighlighted && 'bg-yellow-100 dark:bg-yellow-900/30')}
					style={{ paddingLeft: `${indentSize + 8}px` }}
					onClick={() => hasChildren && onToggle(node)}>
					{/* Expand/Collapse Icon */}
					<div className='w-4 h-4 mr-2 flex items-center justify-center'>
						{hasChildren ? (
							isExpanded ? (
								<ChevronDownIcon className='w-3 h-3 text-muted-foreground' />
							) : (
								<ChevronRightIcon className='w-3 h-3 text-muted-foreground' />
							)
						) : null}
					</div>

					{/* Key */}
					<span className='font-mono text-sm font-medium mr-2'>{node.key}:</span>

					{/* Type Badge */}
					<Badge variant='outline' className='mr-2 text-xs'>
						{node.type}
					</Badge>

					{/* Value */}
					<span className={cn('font-mono text-sm', getTypeColor(node.type))}>{formatValue(node.value, node.type)}</span>

					{/* Copy Button */}
					{copyable && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='ghost'
										size='sm'
										className='ml-auto h-6 w-6 p-0 opacity-0 group-hover:opacity-100'
										onClick={e => {
											e.stopPropagation();
											onCopy(node);
										}}>
										<CopyIcon className='w-3 h-3' />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Copy value</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</div>

				{/* Children */}
				{hasChildren && isExpanded && node.children && (
					<div>
						{node.children.map((child, index) => (
							<TreeNodeComponent
								key={`${child.path.join('.')}-${index}`}
								node={child}
								depth={depth + 1}
								onToggle={onToggle}
								onCopy={onCopy}
								searchTerm={searchTerm}
							/>
						))}
					</div>
				)}
			</div>
		);
	};

	if (error) {
		return (
			<div className={cn('flex items-center justify-center h-full', className)}>
				<div className='text-center'>
					<p className='text-sm text-red-500 mb-2'>Failed to parse {contentType.toUpperCase()}</p>
					<p className='text-xs text-muted-foreground'>{error}</p>
				</div>
			</div>
		);
	}

	if (!rootNode) {
		return (
			<div className={cn('flex items-center justify-center h-full', className)}>
				<p className='text-sm text-muted-foreground'>No data to display</p>
			</div>
		);
	}

	return (
		<div className={cn('flex flex-col h-full', className)}>
			{/* Search Bar */}
			{searchable && (
				<div className='p-3 border-b'>
					<div className='relative'>
						<SearchIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
						<Input placeholder='Search in tree...' value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className='pl-10' />
					</div>
				</div>
			)}

			{/* Tree Content */}
			<ScrollArea className='flex-1'>
				<div className='p-2 group'>
					{rootNode.children?.map((child, index) => (
						<TreeNodeComponent
							key={`${child.path.join('.')}-${index}`}
							node={child}
							depth={0}
							onToggle={handleToggleNode}
							onCopy={handleCopyNode}
							searchTerm={searchTerm}
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
};

export default ResponseTreeView;
