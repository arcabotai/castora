import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';
import isURL from 'validator/lib/isURL';
import Link from 'next/link';
import { truncateLongWord } from '@/utils/textUtils';

interface CastTextProps {
  text: string;
  maxWords?: number;
  firstLineOnly?: boolean;
  maxLines?: number;
}

const CastText: React.FC<CastTextProps> = (props) => {

  const { text: rawText, maxWords, firstLineOnly, maxLines } = props;

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
        // todo fix links like super.sc/woj.eth which are not ens domains
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
    // TEST CASTS:
    // sdv http://localhost:3000/c/0x3b01246ee7bb7a5b57397326fdbabc0f1b3cb6d5
    // http://localhost:3000/c/0xf5db9461acd2555fea09f6106871fe43d257d25a
    // http://localhost:3000/c/0x823f1398032a9f4cbe7329f8dbbe21a6c05bd19f
    // http://localhost:3000/c/0x8d1da29336dd6ab0929d9dd773a46bb33fbf6ba9
    // http://localhost:3000/c/0x92f27504b22f101a9b526da52fe60ef68e31aac1
    // long url: http://localhost:3000/c/0xbd06e5ebb312eda9dbfc47116fa1075bbe6600bb
    // broken url: http://localhost:3000/c/0x8fc1ac90a8d62fdde69a43f590dc44e6108764ad

    // TEST BIOS:
    // http://localhost:3000/woj.eth
    // http://localhost:3000/manan
    // http://localhost:3000/greyseymour
    // http://localhost:3000/lsl

    if (text === null || text === undefined) return "";

    const segments = text.split(/(\s|\n)/);
    // todo handle ENS domains
    // todo handle eth addresses
    // todo handle tickers

    if (maxWords && segments.length > maxWords) {
      segments.splice(maxWords, segments.length - maxWords, '...');
    }

    if (firstLineOnly) {
      const newLineIndex = segments.findIndex((segment) => segment === '\n');
      if (newLineIndex !== -1) {
        segments.splice(newLineIndex, segments.length - newLineIndex);
      }
    }

    if (maxLines) {
      let lineCount = 0;
      const newLineIndices = segments.reduce((acc, segment, index) => {
        if (segment === '\n') {
          lineCount++;
          if (lineCount >= maxLines) {
            acc.push(index);
          }
        }
        return acc;
      }, [] as number[]);

      if (newLineIndices.length > 0) {
        segments.splice(newLineIndices[0], segments.length - newLineIndices[0], '...');
      }
    }

    return segments.map((segment, index) => {

      segment = DOMPurify.sanitize(segment);

      if (!!isMention(segment)) {

        return <span key={index}>
          <Link
            onClick={(e) => e.stopPropagation()}
            href={`/${segment.slice(1, isMention(segment))}`}
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

        return <span className={`${segment.length > 24 ? 'break-all' : ''}`} key={index}>{decodeHTMLEntities(segment)}</span>;

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

export default CastText;
