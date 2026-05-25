export default function PulsingSupercastLogo() {

  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='pb-32'>
        <img
          className="h-12 w-12 dark:hidden animate-pulse"
          src="/castora-mark.svg"
          alt="Castora mark"
        />
        <img
          className="h-12 w-12 hidden dark:block animate-pulse"
          src="/castora-mark.svg"
          alt="Castora mark"
        />
      </div>
    </div>
  )
}
