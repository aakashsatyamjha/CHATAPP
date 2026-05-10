import CryptoJS from 'crypto-js';

// This is a simplified E2EE implementation. 
// In a production app, you would use public/private keys.
// Here we use a unique derived key based on the conversation participants.
const SECRET_SALT = 'chat-app-e2ee-v1-premium-salt';

export const encryptMessage = (text, senderId, recipientId) => {
  if (!text) return text;
  
  // Sort IDs to ensure the key is the same for both parties regardless of who sends
  const ids = [senderId, recipientId].sort();
  const conversationKey = `${ids[0]}_${ids[1]}_${SECRET_SALT}`;
  
  return CryptoJS.AES.encrypt(text, conversationKey).toString();
};

export const decryptMessage = (cipherText, senderId, recipientId) => {
  if (!cipherText) return cipherText;
  
  try {
    const ids = [senderId, recipientId].sort();
    const conversationKey = `${ids[0]}_${ids[1]}_${SECRET_SALT}`;
    
    const bytes = CryptoJS.AES.decrypt(cipherText, conversationKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption fails (e.g. invalid key), it returns an empty string
    return decrypted || cipherText; 
  } catch (err) {
    // If it's not encrypted or decryption fails, return the original text
    return cipherText;
  }
};
