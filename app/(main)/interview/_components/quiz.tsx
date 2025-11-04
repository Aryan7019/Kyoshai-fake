"use client"
import { generateQuiz, saveQuizResult } from '@/actions/interview';
import useFetch from '@/hooks/use-fetch';
import React, { useEffect, useState } from 'react'
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { BarLoader } from 'react-spinners';
import { toast } from 'sonner';
import { Bar } from 'recharts';
import { log } from 'console';
import { Loader2 } from 'lucide-react';
import QuizResult from './quizResult';
interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string
}


const Quiz = () => {
    const [currentQuestion, setCurrentQuestion] = useState<number>(0);
    const [answers, setAnswers] = useState<(string | null)[]>([]);
    const [showExplanation, setShowExplanation] = useState(false)
    const {
        loading: generatingQuiz,
        fn: generateQuizfn,
        data: quizData
    } = useFetch(generateQuiz);

    const {
        loading: savingResult,
        fn: savingQuizResultfn,
        data: resultData,
        setData: setResultData
    } = useFetch(saveQuizResult);
    console.log(resultData);

    // Type cast the data to QuizQuestion[]
    const quizQuestions = quizData as QuizQuestion[] | null;

    useEffect(() => {
        if (quizData) {
            setAnswers(new Array(quizQuestions?.length).fill(null))
        }
    }, [quizQuestions])
    const handleAnswer = (answer: any) => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = answer;
        setAnswers(newAnswers)


    }
    const handleNext = () => {
        if (currentQuestion < (quizQuestions?.length ?? 0) - 1) {
            setCurrentQuestion(currentQuestion + 1)
            setShowExplanation(false)
        } else {
            finishQuiz()
        }

    }
    const calculateScore = () => {
        let correct = 0;
        if (!quizQuestions) return 0;
        answers.forEach((answer, index) => {
            if (answer === quizQuestions[index].correctAnswer) {
                correct++;
            }
        })
        return (correct / quizQuestions.length) * 100;
    }
    const finishQuiz = async () => {
        const score = 0;
        try {
            await savingQuizResultfn(quizQuestions, answers, score)
            toast.success("Quiz completed")
        } catch (error: any) {
            toast.error(error.message || "Failed to save quiz results")

        }
    }

    if (generatingQuiz) {
        return <BarLoader className='mt-4' width={"100%"} color='gray' />
    }
    const startNewQuiz = () => {
        setCurrentQuestion(0);
        setAnswers([]);
        setShowExplanation(false);
        generateQuizfn();
        setResultData(null)

    }

    if (resultData) {
        return (
            <div className='mx-2'><QuizResult result={resultData} onStartNew={startNewQuiz} /></div>
        )
    }
    if (!quizData) {
        return (
            <Card className='mx-2'>
                <CardHeader>
                    <CardTitle>Ready to test your knowledge</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-muted-foreground'>
                        This quiz contains the questions specific to your industry and
                        skills. Take your time and choose the best answer for each question.
                    </p>
                </CardContent>
                <CardFooter>
                    <Button onClick={generateQuizfn} className='w-full'>Start Quiz</Button>
                </CardFooter>
            </Card>
        )
    }
    const question = quizQuestions?.[currentQuestion]
    return (
        <div>
            <Card className='mx-2'>
                <CardHeader>
                    <CardTitle>
                        Question {currentQuestion + 1} of {quizQuestions?.length}
                          </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <p className='text-lg font-medium '>
                        {question?.question}
                    </p>
                    <RadioGroup className='space-y-2'
                        value={answers[currentQuestion]}
                        onValueChange={handleAnswer}
                    >
                        {question?.options.map((option, index) => {
                            return (
                                <div className="flex items-center space-x-2 " key={index}>
                                    <RadioGroupItem value={option} id={`option-${index}`} />
                                    <Label htmlFor={`option-${index}`}>{option}</Label>
                                </div>
                            )

                        })}
                    </RadioGroup>
                    {showExplanation && <div className='mt-4 p-4 bg-muted rounded-lg'>
                        <p className='font-medium'>Explanation:</p>
                        <p className='text-muted-foreground '>{question?.explanation}</p>
                    </div>}
                </CardContent>
                <CardFooter>
                    {!showExplanation && (
                        <Button
                            onClick={() => setShowExplanation(true)}
                            variant={"outline"}
                            disabled={!answers[currentQuestion]}>
                            Show Explanation
                        </Button>
                    )}
                    <Button
                        onClick={handleNext}
                        className='ml-auto'
                        disabled={!answers[currentQuestion] || savingResult}>
                        {savingResult && (
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' width={"100%"} color='gray' />
                        )}
                        {currentQuestion < (quizQuestions?.length ?? 0) - 1 ? "Next Questions" : "Finish Quiz"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

export default Quiz