
import React from 'react'

const AuthLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className='flex justify-center pt-24 pb-12'>
      {children}
    </div>
  )
}

export default AuthLayout