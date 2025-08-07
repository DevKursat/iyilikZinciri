import React, { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';
import { USER_ATTRIBUTES } from '../../constants';

const Profile = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await Auth.currentAuthenticatedUser();
                setUser(currentUser);
            } catch (error) {
                console.log('Error fetching user: ', error);
            }
        };

        fetchUser();
    }, []);

    const handleProfileUpdate = async () => {
        if (!user) return;

        try {
            await Auth.updateUserAttributes(user, {
                [USER_ATTRIBUTES.PROFILE_SETUP]: 'true'
            });
            navigate('/somewhere-else');
        } catch (error) {
            console.log('Error updating user attributes: ', error);
        }
    };

    return (
        <div>
            <h1>Profile Page</h1>
            {user ? (
                <div>
                    <p>Username: {user.username}</p>
                    <p>Email: {user.attributes.email}</p>
                    {/* Add more user attributes here */}
                    <button onClick={handleProfileUpdate}>Complete Profile Setup</button>
                </div>
            ) : (
                <p>Loading user data...</p>
            )}
        </div>
    );
};

export default Profile;