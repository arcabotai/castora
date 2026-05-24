export default function DraftPreviewColumn() {


  return (
    <div className='px-6 py-4 top-0 flex flex-col gap-y-2 min-h-screen max-w-[350px]'>
      <h1 className="font-semibold text-2xl tracking-tight">Draft preview (beta)</h1>
      <p className="text-gray-500 text-sm">Congrats on finding an unannounced feature!</p>
      <p className="text-gray-500 text-sm">You are watching an unpublished draft preview.</p>
      <p className="text-gray-500 text-sm">You can like, recast or reply to the cast now, and it will be sent to the protocol when the post goes live.</p>
      <p className="text-gray-500 text-sm">This way, the post will start with more reactions and will perform better in the feed algorithm.</p>
      <p className="text-red-500 text-sm font-medium">This feature is experimental and may be buggy. If you notice something wrong, please dm @woj.eth</p>
    </div >
  )
}
