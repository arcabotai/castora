import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

export const sendDirectCast = async (recipientFid: number, message: string, fromAccount: 'woj' | 'super') => {
  const apiKey = fromAccount === 'woj' ? process.env.WARPCAST_DM_WOJ_API_KEY : process.env.WARPCAST_DM_API_KEY

  const response = await axios.put("https://api.warpcast.com/v2/ext-send-direct-cast", {
    recipientFid: recipientFid,
    message: message,
    idempotencyKey: uuidv4()
  },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    }
  ).then(response => {
    console.log('Sent DC to:', recipientFid, response.data);
  }).catch(error => {
    console.error('Failed to send direct cast:', error.response.data);
    return { error: 'Failed to send message' };
  });
}