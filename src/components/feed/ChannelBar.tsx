import { useEffect, useState, useRef } from "react"
import { DebounceInput } from 'react-debounce-input'
import Link from "next/link"
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from "@heroicons/react/24/outline"

import axios from 'axios'
import { HOST_URL } from "@/utils/hostURL"


export default function ChannelBar() {

  const [allChannels, setAllChannels] = useState([])

  const [channelLookupValue, setChannelLookupValue] = useState("")
  const [channelLookupResults, setChannelLookupResults] = useState([])
  const [displayedChannelLookupResults, setDisplayedChannelLookupResults] = useState([])
  const [expanded, setExpanded] = useState(false)
  const textInputRef = useRef(null);

  const handleChannelChoice = () => {
    setExpanded(false)
  }

  const fetchAllChannels = async () => {
    axios.get(`${HOST_URL}/api/channels/all-channels`)
      .then((res) => {
        // TODO read from some global context
        setAllChannels(res.data.channels)
      })
      .catch((err) => {
        console.log(err)
      })
  }

  useEffect(() => {
    if (channelLookupValue.length === 0) {
      setChannelLookupResults(allChannels)
    } else {
      const filteredChannels = allChannels.filter((channel) => channel.name.toLowerCase().includes(channelLookupValue.toLowerCase()))
      setChannelLookupResults(filteredChannels)
    }

  }, [channelLookupValue, allChannels])

  useEffect(() => {
    if (expanded) {
      setDisplayedChannelLookupResults(channelLookupResults)
    } else {
      setDisplayedChannelLookupResults(channelLookupResults.slice(0, 3))
    }

  }, [channelLookupResults, expanded])

  useEffect(() => {

    fetchAllChannels()

    const handleKeyPress = (event) => {
      // Check if CMD/CTRL + K is pressed
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        // Focus on the element when the key combination is detected
        textInputRef.current.focus();
      }
    };

    // Attach the event listener when the component mounts
    document.addEventListener('keydown', handleKeyPress);

    // Remove the event listener when the component unmounts
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <div className="flex flex-row justify-between items-start w-full">
      <div className="flex flex-row flex-wrap gap-x-2 gap-y-1 flex-grow">
        <DebounceInput
          inputRef={textInputRef}
          rows={1}
          debounceTimeout={100}
          value={channelLookupValue}
          onChange={(e) => setChannelLookupValue(e.target.value)}
          className="w-28 sm:w-auto border border-md px-2 py-0.5 rounded-md text-sm sm:text-xs text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:border-gray-800 dark:focus:border-white"
          placeholder="Go to channel (cmd+k)"
        />
        {displayedChannelLookupResults.map((channel, index) => (
          <Link
            key={index}
            onClick={() => handleChannelChoice()}
            href={`/channel/${channel.id}`}
            className="focus:outline-none group"
          >
            <div
              className="border border-md px-1 py-0.5 rounded-md text-sm sm:text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 hover:underline hover:bg-gray-100 focus:outline-none group-focus:border-gray-800 dark:group-focus:border-gray-200"
            >
              /{channel.name.toLowerCase()}
            </div>
          </Link>
        ))
        }
      </div>
      {channelLookupResults.length > 3 &&
        <div className="flex flex-row items-center">
          {expanded ?
            <button onClick={() => setExpanded(false)}>
              <ArrowUpCircleIcon className="h-6 sm:h-5 w-6 sm:w-5 text-gray-500" />
            </button>
            :
            <button onClick={() => setExpanded(true)}>
              <ArrowDownCircleIcon className="h-6 sm:h-5 w-6 sm:w-5 text-gray-500" />
            </button>
          }
        </div>
      }
    </div >
  )
}
