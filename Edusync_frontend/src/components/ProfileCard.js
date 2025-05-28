import React from 'react';
import './ProfileCard.css';

const ProfileCard = ({ user, stats }) => {
    const defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

    return (
        <div className="profile-card">
            <div className="profile-header">
                <div className="profile-avatar">
                    <img src={user.avatar || defaultAvatar} alt={user.username} />
                </div>
                <div className="profile-info">
                    <h2>{user.username}</h2>
                    <p className="role">{user.role}</p>
                    <p className="email">{user.email}</p>
                    <p className="join-date">Member since: {new Date(user.joinDate).toLocaleDateString()}</p>
                </div>
            </div>
            <div className="profile-stats">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-item">
                        <h3>{stat.value}</h3>
                        <p>{stat.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProfileCard; 