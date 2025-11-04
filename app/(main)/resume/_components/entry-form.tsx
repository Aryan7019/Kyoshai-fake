"use client"
import { entrySchema, resumeSchema } from '@/app/lib/schema'
import { Button } from '@/components/ui/button'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PlusCircle, Sparkles, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import useFetch from '@/hooks/use-fetch'
import { improveWithAi } from '@/actions/resume'
import { toast } from 'sonner'
import { format, parse } from 'date-fns'

const EntryForm = ({ type, entries, onChange }: any) => {
    const [isAdding, setIsAdding] = useState(false)
    const formatDisplayDate = (dateString: any) => {
        if (!dateString) {
            return ""
        }
        const date = parse(dateString, "yyyy-MM", new Date());
        return format(date, "MMM yyyy")
    }
    const {
        register,
        watch,
        handleSubmit: handleValidation,
        formState: { errors },
        setValue, reset
    } = useForm({
        resolver: zodResolver(entrySchema),
        defaultValues: {
            title: "",
            organization: "",
            startDate: "",
            endDate: "",
            description: "",
            current: false
        }
    })
    const current = watch("current");
    const description = watch("description");

    const {
        loading: isImproving,
        fn: improveWithAiFn,
        data: improvedContent,
        error: improveError
    } = useFetch(improveWithAi)

    const handleDelete = (index:any) => { 
        //@ts-ignore
        const newEntries = entries.filter((_,i)=> i !== index)
        onChange(newEntries)
    }
    const handleAdd = handleValidation((data) => {
        const formattedEntry = {
            ...data,
            startDate: formatDisplayDate(data.startDate),
            endDate: data.current ? "" : formatDisplayDate(data.endDate)
        }

        onChange([...entries, formattedEntry]);
        reset;
        setIsAdding(false)
    })

    useEffect(() => {
        if (improvedContent && !isImproving) {
            setValue("description", improvedContent)
            toast.success("Description improved successfully!")
        }
        if (improveError) {
            const message = (improveError as any)?.message || String((improveError as any)) || "Failed to improve description"
            toast.error(message)
        }

    }, [improvedContent, improveError, isImproving])

    const handleImproveDescription = async () => {
        if (!description) {
            toast.error("Please enter a description first");
            return
        }

        const organization = watch("organization");
        const title = watch("title");

        await improveWithAiFn({
            current: description,
            type: type.toLowerCase(),
            organization: organization.toLowerCase(),
            title: title.toLowerCase()
        })
    }

    return (
        <div className='space-y-4'>
            <div className='space-y-4'>
                {entries.map((item:any,index:any) => {
                    return (
                        <Card key={index}>
                            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                                <CardTitle className='text-sm font-medium'>{item.title} @ {item.organization}</CardTitle>
                                <Button variant={"outline"} size={"icon"} type='button' onClick={()=>handleDelete(index)}><X className='h-4 w-4'/></Button>
                            </CardHeader>
                            <CardContent>
                                <p className='text-sm text-muted-foreground'>
                                    {item.current? `${item.startDate} - Present` : `${item.startDate} - ${item.endDate}`}
                                </p>
                                <p className='mt-2 text-sm whitespace-pre-wrap'>
                                    {item.description}
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            {isAdding && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add {type}</CardTitle>
                        <CardDescription>
                            Add your {type.toLowerCase()} information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className='space-y-2'>
                                <Input
                                    placeholder='Title/Position'
                                    {...register("title")}
                                    aria-invalid={!!errors.title}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-600">{errors.title.message}</p>
                                )}
                            </div>
                            <div className='space-y-2'>
                                <Input
                                    placeholder='Organization/Company'
                                    {...register("organization")}
                                    aria-invalid={!!errors.organization}
                                />
                                {errors.organization && (
                                    <p className="text-sm text-red-600">{errors.organization.message}</p>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className='space-y-2'>
                                <Input
                                    type='month'
                                    placeholder='Start Date'
                                    {...register("startDate")}
                                    aria-invalid={!!errors.startDate}
                                />
                                {errors.startDate && (
                                    <p className="text-sm text-red-600">{errors.startDate.message}</p>
                                )}
                            </div>
                            <div className='space-y-2'>
                                <Input
                                    type='month'
                                    placeholder='End Date'
                                    {...register("endDate")}
                                    disabled={current}
                                    aria-invalid={!!errors.endDate}
                                />
                                {errors.endDate && (
                                    <p className="text-sm text-red-600">{errors.endDate.message}</p>
                                )}
                            </div>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <input
                                type='checkbox'
                                id='current'
                                {...register("current")}
                                onChange={(e) => {
                                    setValue("current", e.target.checked)
                                    if (e.target.checked) {
                                        setValue('endDate', "")
                                    }
                                }}
                            />
                            <label htmlFor='current' className="text-sm font-medium">
                                Current {type}
                            </label>
                        </div>
                        <div className='space-y-2'>
                            <Textarea
                                className='h-32'
                                placeholder={`Description of your ${type.toLowerCase()}`}
                                {...register("description")}
                                aria-invalid={!!errors.description}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-600">{errors.description.message}</p>
                            )}
                            <Button
                                type='button'
                                variant={"ghost"}
                                size={"sm"}
                                onClick={handleImproveDescription}
                                disabled={isImproving || !description}
                                className="mt-2"
                            >
                                {isImproving ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Improving...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className='h-4 w-4 mr-2' />
                                        Improve with AI
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className=" flex justify-end space-x-2">
                        <Button type='button' variant={"outline"} onClick={() => {
                            reset();
                            setIsAdding(false)
                        }}>Cancel</Button>
                        <Button type='button' onClick={handleAdd}>
                            <PlusCircle className='h-4 w-4 ' />
                            Add Entry
                        </Button>
                    </CardFooter>
                </Card>
            )}
            {!isAdding && (
                <Button
                    className='w-full'
                    variant={"outline"}
                    onClick={() => setIsAdding(true)}
                >
                    <PlusCircle className='h-4 w-4 mr-2' />
                    Add {type}
                </Button>
            )}
        </div>
    )
}

export default EntryForm