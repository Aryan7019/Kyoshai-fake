import { getResume } from '@/actions/resume'
import ResumeBuilder from './_components/resume-builder'
import { Loader2 } from 'lucide-react'

const ResumePage = async () => {
  const resume = await getResume()
  
  console.log("Resume fetched:", {
    hasContent: !!resume?.content,
    hasFormData: !!resume?.formData,
    contentLength: resume?.content?.length || 0
  })
  
  return (
    <div className='container mx-auto py-6'>
      <ResumeBuilder 
        initialContent={resume?.content}
        initialFormData={resume?.formData}
      />
    </div>
  )
}

export default ResumePage