import React from 'react';
import { useAppContext } from '../context/AppContext';

const DebugPanel: React.FC = () => {
  const { data } = useAppContext();

  return (
    <div className="debug-panel card" style={{ margin: '2rem', padding: '2rem', background: '#f0f0f0' }}>
      <h2>Debug Info</h2>
      <div>
        <strong>Total Posts:</strong> {data.posts.length}
      </div>
      <div>
        <strong>Monthly Plans:</strong> {data.monthlyPlans.length}
      </div>

      {data.posts.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Sample Posts (first 3):</h3>
          {data.posts.slice(0, 3).map((post) => (
            <div key={post.id} style={{ marginBottom: '1rem', padding: '0.5rem', background: 'white' }}>
              <div><strong>ID:</strong> {post.id}</div>
              <div><strong>Date:</strong> {post.date}</div>
              <div><strong>Time:</strong> {post.time}</div>
              <div><strong>Topic:</strong> {post.topic}</div>
              <div><strong>Platform:</strong> {post.platform}</div>
              <div><strong>Goal:</strong> {post.goal}</div>
              <div><strong>Status:</strong> {post.status}</div>
            </div>
          ))}
        </div>
      )}

      {data.posts.length === 0 && (
        <div style={{ marginTop: '1rem', color: 'red' }}>
          <strong>No posts found in storage!</strong>
          <p>Try generating a content plan first.</p>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
