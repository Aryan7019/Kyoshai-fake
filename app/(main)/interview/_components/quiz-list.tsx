"use client"
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import QuizResult from './quizResult'

const QuizList = ({ assessments }: any) => {
  const router = useRouter()
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  return (
    <>
      <Card>
        <CardHeader className='flex items-center justify-between'>
          <div>
            <CardTitle className='gradient-title text-3xl md:text-4xl'>Recent Quizes</CardTitle>
            <CardDescription>Review your past quiz performance</CardDescription>
          </div>
          <Button onClick={() => router.push("/interview/mock")}>Start New Quiz</Button>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {assessments.map((assessment: any, i: any) => (
              <Card key={assessment.id} className='cursor-pointer hover:bg-muted/50 transition-colors' onClick={() => setSelectedQuiz(assessment)}>
                <CardHeader>
                  <CardTitle>Quiz {i + 1}</CardTitle>
                  <CardDescription className='flex justify-between w-full'>
                    <div>Score: {assessment.quizScore.toFixed(1)}%</div>
                    <div>
                      {format(new Date(assessment.createdAt), "MMMM dd, yyyy HH:mm"
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className='text-sm text-muted-foreground'>{assessment.improvementTip}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>

      </Card>

      <Dialog open={!!selectedQuiz} onOpenChange={() => setSelectedQuiz(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle></DialogTitle>
          </DialogHeader>
          <QuizResult
            result={selectedQuiz}
            hideStartNew
            onStartNew={() => router.push("/interview/mock")}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export default QuizList