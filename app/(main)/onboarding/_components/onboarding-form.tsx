"use client"
import { Industry } from '@/data/industries';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { onboardingSchema, } from '@/app/lib/schema';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { updateUser } from '@/actions/user';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
type OnBoardingFormData = {
    industry: string;
    subIndustry: string;
    bio?: string;
    experience: number;
    skills?: string[];
};
interface OnBoardingFormProps {
    industries: Industry[];
}
const OnBoardingForm = ({ industries }: OnBoardingFormProps) => {
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const router = useRouter();
    const { data: updateResult, loading: updateLoading, fn: updateUserFn } = useFetch(updateUser);
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
        resolver: zodResolver(onboardingSchema)
    });
    const watchIndustry = watch('industry');
    const onSubmit = async (values: OnBoardingFormData) => {
        try {
            const formattedIndustry = `${values.industry}-${values.subIndustry
                .toLowerCase()
                .replace(/ /g, "-")}`;
            await updateUserFn({
                ...values,
                industry: formattedIndustry,
            });

        } catch (error) {
            console.error('Error submitting form:', error);
        }
    };

    useEffect(() => {
        if (updateResult && !updateLoading) {
            toast.success("Profile updated successfully!");
            router.push('/dashboard');
            router.refresh();
        }
    }, [updateResult, updateLoading]);

    return (
        <div className='flex items-center justify-center bg-background'>
            <Card className='w-full max-w-lg mt-10 mx-2'>
                <CardHeader>
                    <CardTitle className='gradient-title text-4xl'>Complete Your Profile</CardTitle>
                    <CardDescription>Select your industry to get personalized career insights and
                        recommendations.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action="" className='space-y-6 ' onSubmit={handleSubmit(onSubmit)}>
                        <div className='space-y-2'>
                            <Label htmlFor="industry" className="">Indutstry</Label>
                            <Select
                                onValueChange={(value: string) => {
                                    setValue('industry', value);

                                    setSelectedIndustry(
                                        industries.find((ind) => ind.id === value) || null
                                    );
                                    setValue('subIndustry', '');
                                }}
                            >
                                <SelectTrigger id='industry' className="w-[180px]">
                                    <SelectValue placeholder="Select an Industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {industries.map((industry) => {
                                        return (
                                            <SelectItem key={industry.id} value={industry.id}>
                                                {industry.name}
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                            {errors.industry && (
                                <p className='text-sm text-red-500'>{errors.industry.message}</p>
                            )}
                        </div>
                        {watchIndustry &&
                            <div className='space-y-2'>
                                <Label htmlFor="subIndustry" className="">Specialization</Label>
                                <Select
                                    onValueChange={(value: string) => {
                                        setValue('subIndustry', value);

                                    }}
                                >
                                    <SelectTrigger id='subIndustry' className="w-[180px]">
                                        <SelectValue placeholder="Select a Specialization" />
                                    </SelectTrigger>
                                    <SelectContent>

                                        {selectedIndustry?.subIndustries.map((subIndustry) => {
                                            return (
                                                <SelectItem key={subIndustry} value={subIndustry}>
                                                    {subIndustry}
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectContent>
                                </Select>
                                {errors.subIndustry && (
                                    <p className='text-sm text-red-500'>{errors.subIndustry.message}</p>
                                )}
                            </div>}
                        <div className='space-y-2'>
                            <Label htmlFor="experience" className="">Years of Experience</Label>
                            <Input id="experience" type='number' min="0" max="50" placeholder="Enter years of experience"
                                {...register('experience')} />

                            {errors.experience && (
                                <p className='text-sm text-red-500'>{errors.experience.message}</p>
                            )}
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor="skills" className="">Skills</Label>
                            <Input id="skills" placeholder="e.g., Python, JavaScript, Project Management"
                                {...register('skills')} />
                            <p className='text-sm text-muted-foreground'>Separate multiple skills with commas</p>

                            {errors.skills && (
                                <p className='text-sm text-red-500'>{errors.skills.message}</p>
                            )}
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor="bio" className="">Professional Bio</Label>
                            <Textarea id="bio" className="h-32" placeholder="Tell us about your Professional Background"
                                {...register('bio')} />

                            {errors.bio && (
                                <p className='text-sm text-red-500'>{errors.bio.message}</p>
                            )}
                        </div>
                        <Button type='submit' className='w-full' disabled={updateLoading}>
                            {updateLoading ? (
                                <>
                                    <Loader2 className='animate-spin mr-2 h-4 w-4' />
                                    Saving...
                                </>

                            ) : ("Complete Profile")}
                        </Button>
                    </form>
                </CardContent>

            </Card>
        </div>
    )
}

export default OnBoardingForm