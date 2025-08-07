import { updateUserAttributes } from 'aws-amplify/auth';
import { formatUserAttributes } from '../../utils/formatUserAttributes';

async function updateProfile(profileData) {
  try {
    const attributes = {
      name: String(profileData.name),
      birthdate: String(profileData.birthdate),
      'custom:social_facebook': String(profileData.social_facebook || ''),
      'custom:social_instagram': String(profileData.social_instagram || ''),
      'custom:social_linkedin': String(profileData.social_linkedin || ''),
      'custom:social_reddit': String(profileData.social_reddit || ''),
      'custom:social_tiktok': String(profileData.social_tiktok || ''),
      'custom:social_x': String(profileData.social_x || ''),
      'custom:iyilik_tercihleri': String(profileData.iyilik_tercihleri || ''),
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
