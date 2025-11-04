import { getResume } from '@/actions/resume'
import { Suspense } from 'react'
import ResumeBuilder from './_components/resume-builder'
import { Loader2 } from 'lucide-react'

const ResumePage = async () => {
  const resume = await getResume()
  
  return (
    <div className='container mx-auto py-6'>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading Resume Builder...</p>
          </div>
        </div>
      }>
        <ResumeBuilder initialContent={resume?.content}/>
      </Suspense>
    </div>
  )
}

export default ResumePage