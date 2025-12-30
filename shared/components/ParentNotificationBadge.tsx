import React, { useState, useEffect } from 'react';
import { pointRequestService } from '../services/pointRequestService';

type ParentNotificationBadgeProps = {
  visible?: boolean;
};

const ParentNotificationBadge: React.FC<ParentNotificationBadgeProps> = ({ visible = true }) => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const requests = await pointRequestService.getPendingRequests();
        setPendingCount(requests.length);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
      }
    };

    fetchPendingRequests();
    
    // Set up polling for updates
    const interval = setInterval(fetchPendingRequests, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (!visible || pendingCount === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#ef4444',
        color: 'white',
        borderRadius: '50%',
        width: 20,
        height: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      {pendingCount > 9 ? '9+' : pendingCount}
    </div>
  );
};

export default ParentNotificationBadge;