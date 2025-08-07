import React, { useEffect, useState } from 'react';
import { Auth } from 'aws-amplify';
import { useNavigate } from 'react-router-dom';

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
            // Attribute değerini string olarak gönderiyoruz
            const attributes = {
                'custom:profile_setup': 'true'  // USER_ATTRIBUTES.PROFILE_SETUP yerine direkt string
            };
            
            await Auth.updateUserAttributes(user, attributes);
            console.log('Profile updated successfully');
            navigate('/somewhere-else');
        } catch (error) {
            console.error('Error updating user attributes: ', error);
            // Hata detaylarını göster
            if (error.message) {
                alert(`Profil güncellenirken hata oluştu: ${error.message}`);
            }
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