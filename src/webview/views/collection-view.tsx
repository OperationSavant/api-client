import React from 'react';

interface CollectionViewProps {
	viewId?: string;
	viewName?: string;
}

const CollectionView: React.FC<CollectionViewProps> = ({ viewId, viewName }) => {
	return (
		<div>
			<h2>{viewName}</h2>
			<p>View ID: {viewId}</p>
		</div>
	);
};

export default CollectionView;
