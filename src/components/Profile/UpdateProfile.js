import { updateUserAttributes } from 'aws-amplify/auth';
import { formatUserAttributes } from '../../utils/formatUserAttributes';

async function updateProfile(profileData) {
  try {
    const attributes = {
      name: profileData.name,
      birthdate: profileData.birthdate,
      'custom:social_facebook': profileData.social_facebook || '',
      'custom:social_instagram': profileData.social_instagram || '',
      'custom:social_linkedin': profileData.social_linkedin || '',
      'custom:social_reddit': profileData.social_reddit || '',
      'custom:social_tiktok': profileData.social_tiktok || '',
      'custom:social_x': profileData.social_x || '',
      'custom:iyilik_tercihleri': profileData.iyilik_tercihleri || '',
      'custom:setup_complete': 'true'
    };

    const formattedAttributes = formatUserAttributes(attributes);
    
    await updateUserAttributes({
      attributes: formattedAttributes
    });

    return { success: true };
  } catch (error) {
    console.error('Profile update error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

export { updateProfile };
