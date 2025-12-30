import React, { useState, useEffect } from 'react';
import { pointRequestService } from '../services/pointRequestService';
import type { PointRequest } from '../types/pointRequestTypes';

type PointRequestApprovalPanelProps = {
  onRequestsUpdate?: (count: number) => void;
};

const PointRequestApprovalPanel: React.FC<PointRequestApprovalPanelProps> = ({ 
  onRequestsUpdate 
}) => {
  const [pendingRequests, setPendingRequests] = useState<PointRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const requests = await pointRequestService.getPendingRequests();
      setPendingRequests(requests);
      onRequestsUpdate?.(requests.length);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
    
    // Set up polling for updates
    const interval = setInterval(fetchPendingRequests, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await pointRequestService.approvePointRequest(id);
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setProcessingId(id);
    try {
      await pointRequestService.declinePointRequest(id);
      await fetchPendingRequests();
    } catch (error) {
      console.error('Error declining request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 16, textAlign: 'center' }}>
        Loading requests...
      </div>
    );
  }

  if (pendingRequests.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: 'center', opacity: 0.7 }}>
        No pending requests
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h3>Pending Requests ({pendingRequests.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {pendingRequests.map((request) => (
          <div
            key={request.id}
            style={{
              padding: 16,
              border: '1px solid #ddd',
              borderRadius: 8,
              backgroundColor: 'white'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0 }}>{request.title}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: 14 }}>
                  {request.points} points
                </p>
                {request.description && (
                  <p style={{ margin: '8px 0 0 0', fontSize: 14, opacity: 0.8 }}>
                    {request.description}
                  </p>
                )}
                <p style={{ margin: '8px 0 0 0', fontSize: 12, opacity: 0.6 }}>
                  Requested: {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => handleDecline(request.id)}
                disabled={processingId === request.id}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ef4444',
                  background: 'white',
                  color: '#ef4444',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {processingId === request.id ? 'Declining...' : 'Decline'}
              </button>
              <button
                onClick={() => handleApprove(request.id)}
                disabled={processingId === request.id}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {processingId === request.id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PointRequestApprovalPanel;