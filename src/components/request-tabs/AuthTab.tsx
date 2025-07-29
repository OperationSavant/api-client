import React from 'react';

const AuthTab: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col"> {/* Make it a flex container that takes available space */}
      <div className="p-4 overflow-y-auto flex-1"> {/* New inner div for padding and scrolling */}
        <p>Authentication settings will go here.</p>
      </div>
    </div>
  );
};

export default AuthTab;