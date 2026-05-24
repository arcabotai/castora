export default function PulsingSupercastLogo() {

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='pb-32'>
        <img
          className="h-12 w-12 dark:hidden animate-pulse"
          src="/supercast-logo-black.png"
          alt="Supercast logo"
        />
        <img
          className="h-12 w-12 hidden dark:block animate-pulse"
          src="/supercast-logo-white.png"
          alt="Supercast logo"
        />
      </div>
    </div>
  )
}
