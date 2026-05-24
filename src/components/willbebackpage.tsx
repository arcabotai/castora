import React from 'react';

const WillBeBackPage: React.FC = () => {
  return (
    <div className='flex flex-col py-32 pl-20'>
      <h1 className='font-bold mb-2'>We will be back soon</h1>
      <p className='mb-1'>Supercast is a bit too popular right now.</p>
      <p>If you need to vent, please join the <a className="hover:underline font-bold" href="https://t.me/supercastxyz">support group</a> or post <a className='hover:underline font-bold' href="https://warpcast.com/~/compose?text=@woj.eth please bring @supercast back">"@woj.eth please bring @supercast back"</a></p>
    </div>
  );
};

export default WillBeBackPage;
