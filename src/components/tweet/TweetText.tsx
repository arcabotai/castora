import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import isURL from 'validator/lib/isURL';
import Link from 'next/link';
import { truncateLongWord } from '@/utils/textUtils';

interface CastTextProps {
  text: string;
}

const TweetText: React.FC<CastTextProps> = (props) => {

  const rawText = props.text;

  const isMention = (segment: string): number => {
    // if 0, not a mention
    // if number, length of mention
    const mentionPattern = /^@([\w-]+)(?:\.eth)?\b/g;

    const mention = segment.match(mentionPattern);

    if (mention) {
      return mention[0].length
    }
    return 0
  }

  const isLink = (segment: string) => {
    if (isURL(segment, { require_tld: true, require_protocol: false })) {
      if (segment.endsWith('.eth')) {
        // separate treatment for ENS domains
        // todo fix app links like castora.social/woj.eth which are not ens domains
        return false
      }

      if (segment.endsWith('.telegram')) {
        // separate treatment for telegram
        return false
      }

      if (segment.endsWith('.twitter')) {
        // separate treatment for twitter
        return false
      }

      return true
    }
  }

  const isTwitter = (segment: string) => {
    if (segment.endsWith('.twitter')) {
      return true
    }
  }

  const isTelegram = (segment: string) => {
    if (segment.endsWith('.telegram')) {
      return true
    }
  }

  const isChannel = (segment: string) => {
    // if 0, not a mention
    // if number, length of mention

    const channelPattern = /^\/([\w-]+)\b/g;

    const channel = segment.match(channelPattern);

    if (channel) {
      return channel[0].length
    }

    return 0
  }

  const isNewLine = (segment: string) => {
    if (segment === '\n') {
      return true
    }
  }

  function decodeHTMLEntities(text) {
    const entities = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
    };

    return text.replace(/&lt;|&gt;|&amp;|&quot;|&#39;/g, (match) => entities[match]);
  }

  const processCastText = (text: string) => {

    if (text === null || text === undefined) return "";

    const segments = text.split(/(\s|\n)/);

    return segments.map((segment, index) => {

      segment = DOMPurify.sanitize(segment);

      if (!!isMention(segment)) {

        return <span key={index}>
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`https://x.com/${segment.slice(1, isMention(segment))}`}
            className='text-blue-500 hover:underline'
          >
            {segment.slice(0, isMention(segment))}
          </Link>
          <span>{segment.slice(isMention(segment))}</span>
        </span>

      } else if (isLink(segment)) {
        // add https:// if not present
        let httpLink = segment;
        if (!segment.startsWith('http')) {
          httpLink = 'https://' + segment
        }

        return <a
          key={index}
          onClick={(e) => e.stopPropagation()}
          href={httpLink} target='_blank' className='text-blue-500 hover:underline'>{truncateLongWord(segment, 36)}
        </a>

      } else if (isTwitter(segment)) {

        return <a
          key={index}
          onClick={(e) => e.stopPropagation()}
          href={`https://twitter.com/${segment.slice(0, segment.length - 8)}`}
          target='_blank'
          className='text-blue-500 hover:underline'
        >
          {segment}
        </a>

      } else if (isTelegram(segment)) {

        return <a
          key={index}
          onClick={(e) => e.stopPropagation()}
          href={`https://t.me/${segment.slice(0, segment.length - 9)}`}
          target='_blank'
          className='text-blue-500 hover:underline'
        >
          {segment}
        </a>

      } else if (isChannel(segment)) {

        return <span key={index}>
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/channel/${segment.slice(1, isChannel(segment))}`}
            className='text-blue-500 hover:underline'
          >
            {segment.slice(0, isChannel(segment))}
          </Link>
          <span>{segment.slice(isChannel(segment))}</span>
        </span>

      } else if (isNewLine(segment)) {

        return <br key={index} />;

      } else {

        return <span key={index}>{decodeHTMLEntities(segment)}</span>;

      }
    })
  }

  const processedCastText = useMemo(() => processCastText(rawText), [rawText]);

  return (
    <span>
      {processedCastText}
    </span>
  );
};

export default TweetText;
