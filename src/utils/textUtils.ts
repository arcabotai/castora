import { Embed } from "@/types/index";
import { parentUrlChannelMap } from "./parentUrlChannelMap";

import DOMPurify from 'dompurify';

export const truncateLongWord = (word: string, maxLength: number) => {
  if (!word) return ''
  if (word.length < maxLength) return word
  return `${word.slice(0, maxLength)}...`
}

export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num)
}

export const getProcessedCastContent = (text: string, embeds: Embed[]): string => {


  let processedContent = `<span>${text}</span>`;
  processedContent = DOMPurify.sanitize(processedContent);

  processedContent = processedContent.replace(/\n/g, '<br/>');

  embeds.forEach((embed) => {
    processedContent = processedContent.replace(embed.url, '')
  })

  const mentionPattern = /(?<![/\w])@([\w-]+)(?:\.eth)?\b/g;

  const mentions = processedContent.match(mentionPattern);

  mentions?.forEach((mention) => {
    processedContent = processedContent.replace(mention, `<a href='/${mention.slice(1)}' onclick="event.stopPropagation();" class='truncate text-blue-500 hover:underline'>${mention}</a>`)
  })

  const urlPattern = /(https?:\/\/[\w.-]+\.[a-zA-Z]{2,}(\/\S*?)?)(?=<br\/>|$)/g

  const urls = processedContent.match(urlPattern);

  urls?.forEach((url) => {
    processedContent = processedContent.replace(url, `<a href='${url}' onclick="event.stopPropagation();" target='_blank' class='truncate text-blue-500 hover:underline'>${truncateLongWord(url, 36)}</a>`)
  })

  const channelRegex = /(?<=\s|^|[\.,;:])\/\w+(-\w+)?/g;

  const channels = processedContent.match(channelRegex);

  channels?.forEach((channel) => {
    if (parentUrlChannelMap.map(channel => channel.channel_id).includes(channel.slice(1))) {
      processedContent = processedContent.replace(channel, `<a href='/channel/${channel.slice(1)}' onclick="event.stopPropagation();" class='truncate text-blue-500 hover:underline'>${channel}</a>`)
    }
  })

  const proceedingLinebreakPattern = /^(<br\/>)+/;
  const followingLinebreakPattern = /(<br\/> ?)+$/;

  processedContent = processedContent.replace(proceedingLinebreakPattern, "");
  processedContent = processedContent.replace(followingLinebreakPattern, "");

  return processedContent
}

export const truncateEthAddress = (address: string) => {
  return `${address.slice(0, 5)}...${address.slice(-3)}`
}


export const getTimeSinceTimestamp = (timestamp: number | string, short?: boolean): string => {
  // get difference in seconds between now and timestamp
  const dateTimestamp = new Date(timestamp);
  const now: Date = new Date();
  const seconds: number = Math.floor((now.getTime() - dateTimestamp.getTime()) / 1000);


  // years
  let interval = seconds / 31536000;
  if (Math.floor(interval) > 1) {
    if (short) {
      return Math.floor(interval) + "y";
    } else {
      Math.floor(interval) + " years ago";
    }
  }
  if (Math.floor(interval) == 1) {
    if (short) {
      return "1y";
    } else {
      return "a year ago";
    }
  }

  // months
  interval = seconds / 2592000;
  if (Math.floor(interval) > 1) {
    if (short) {
      return Math.floor(interval) + "mo";
    } else {
      return Math.floor(interval) + " months ago";
    }
  }
  if (Math.floor(interval) == 1) {
    if (short) {
      return "1mo";
    } else {
      return "a month ago";
    }
  }

  // days
  interval = seconds / 86400;
  if (Math.floor(interval) > 1) {
    if (short) {
      return Math.floor(interval) + "d";
    } else {
      return Math.floor(interval) + " days ago";
    }
  }
  if (Math.floor(interval) == 1) {
    if (short) {
      return "1d";
    } else {
      return "a day ago";
    }
  }

  // hours
  interval = seconds / 3600;
  if (Math.floor(interval) > 1) {
    if (short) {
      return Math.floor(interval) + "h";
    } else {
      return Math.floor(interval) + " hours ago";
    }
  }
  if (Math.floor(interval) == 1) {
    if (short) {
      return "1h";
    } else {
      return "an hour ago";
    }
  }

  // minutes
  interval = seconds / 60;
  if (Math.floor(interval) > 1) {
    if (short) {
      return Math.floor(interval) + "m";
    } else {
      return Math.floor(interval) + " minutes ago";
    }
  }
  if (Math.floor(interval) == 1) {
    if (short) {
      return "1m";
    } else {
      return "a minute ago";
    }
  }
  if (short) {
    return Math.max(Math.floor(seconds), 1) + "s";
  } else {
    return Math.max(Math.floor(seconds), 1) + " seconds ago";
  }
}

export const parentURLToChannelName = (parentURL: string): string => {

  if (!parentURL) {
    return null
  }

  const oldChannel = parentUrlChannelMap.find((channel) => channel.parent_url === parentURL)?.name.toLowerCase() || null

  if (oldChannel) {
    return oldChannel
  }

  const warpcastChannelPattern = /https:\/\/warpcast\.com\/~\/channel\/[a-zA-Z0-9-]+/g;

  const warpcastChannel = parentURL.match(warpcastChannelPattern);

  if (warpcastChannel) {
    return warpcastChannel[0].split("/")[5]
  }
}

export const parentURLToChannelId = (parentURL: string): string => {
  if (!parentURL) {
    return null
  }

  const oldChannelId = parentUrlChannelMap.find((channel) => channel.parent_url === parentURL)?.channel_id.toLowerCase() || ''

  if (oldChannelId) {
    return oldChannelId
  }

  const warpcastChannelPattern = /https:\/\/warpcast\.com\/~\/channel\/[a-zA-Z0-9-]+/g;

  const warpcastChannel = parentURL.match(warpcastChannelPattern);

  if (warpcastChannel) {
    return warpcastChannel[0].split("/")[5]
  }

}

export const channelIdToChannelName = (channelId: string): string => {
  return parentUrlChannelMap.find((channel) => channel.channel_id === channelId)?.name.toLowerCase() || ''
}

export const stringByteLength = (str) => {
  let byteLength = 0;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      byteLength += 1;
    } else if (charCode < 0x800) {
      byteLength += 2;
    } else if (charCode < 0xD800 || charCode >= 0xE000) {
      byteLength += 3;
    } else {
      // Surrogate pair
      byteLength += 4;
      i++; // Skip the next character
    }
  }
  return byteLength;
}
