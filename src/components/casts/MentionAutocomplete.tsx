export default function MentionAutocomplete({ autocompleteSuggestions, setMentionUsername }: { autocompleteSuggestions: any[], setMentionUsername: React.Dispatch<React.SetStateAction<string>> }) {

  return (
    <div>
      {autocompleteSuggestions.length > 0 &&
        <div className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-md flex flex-col divide-y dark:divide-gray-700">
          {autocompleteSuggestions.map((user) => (
            <div
              onClick={() => setMentionUsername(user.username)}
              key={user.fid}
              className="flex flex-row items-center space-x-2 py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-800 hover:cursor-pointer"
            >
              <img src={user.pfp_url} className="inline-block h-8 w-8 rounded-full bg-gray-100"></img>
              <div className="min-w-0 flex-1 flex flex-row items-center">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mr-1">{user.display_name}</div>
                <div className="text-sm text-gray-500 truncate">@{user.username}</div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
