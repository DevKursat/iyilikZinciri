/**
 * Formats user attributes for Cognito update operation
 * @param {Object} attributes - Raw user attributes object
 * @returns {Object[]} Formatted attributes array for Cognito
 */
export function formatUserAttributes(attributes) {
  const formattedAttributes = [];

  for (const [key, value] of Object.entries(attributes)) {
    // Skip null/undefined values
    if (value == null) continue;

    // Handle custom attributes
    const attrName = key.startsWith('custom:') ? key : key;
    
    formattedAttributes.push({
      Name: attrName,
      Value: String(value) // Ensure value is string
    });
  }

  return formattedAttributes;
}
