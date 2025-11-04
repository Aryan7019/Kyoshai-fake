"use client"
import { Button } from '@/components/ui/button'
import { AlertTriangle, Download, Edit, Loader2, Monitor, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resumeSchema } from '@/app/lib/schema'
import useFetch from '@/hooks/use-fetch'
import { saveResume } from '@/actions/resume'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import EntryForm from './entry-form'
import { entriesToMarkdown } from '@/app/lib/helper'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Dynamically import MDEditor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { 
    ssr: false,
    loading: () => <div className="h-[800px] border rounded-lg flex items-center justify-center">Loading editor...</div>
  }
)


const ResumeBuilder = ({ initialContent }: any) => {
    const [activeTab, setActiveTab] = useState("edit")
    const [resumeMode, setResumeMode] = useState("preview")
    const [previewContent, setPreviewContent] = useState(initialContent || "")
    const [isGenerating, setIsGenerating] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const { user } = useUser();

    // Ensure component is mounted on client side
    useEffect(() => {
        setIsMounted(true)
    }, [])
    const {
        control, register, watch, formState: { errors }
    } = useForm({
        resolver: zodResolver(resumeSchema),
        defaultValues: {
            contactInfo: {
                email: "",
                mobile: "",
                linkedin: "",
                github: "",
                twitter: "",
                leetcode: ""
            },
            summary: "",
            skills: "",
            experience: [],
            projects: [],
            education: []
        }
    })
    const {
        loading: isSaving,
        fn: saveResumeFn,
        data: saveResult,
        error: saveError
    } = useFetch(saveResume)

    const formValues = watch()
    useEffect(() => {
        if (initialContent) setActiveTab("preview");
    }, [initialContent])

    useEffect(() => {
        if (activeTab === "edit") {
            const newContent = getCombinedContent();
            setPreviewContent(newContent ? newContent : initialContent)
        }

    }, [formValues, activeTab])
    useEffect(() => {
        if (saveResult && !isSaving) {
            toast.success("Resume saved successfully!");
        }
        if (saveError) {
            toast.error( "Failed to save resume");
        }
    }, [saveResult, saveError, isSaving]);
    const getContactMarkdown = () => {
        const { contactInfo } = formValues || {}
        const parts = [];

        if (contactInfo?.email) parts.push(`Email: ${contactInfo.email}`);
        if (contactInfo?.mobile) parts.push(`Phone: ${contactInfo.mobile}`);
        if (contactInfo?.linkedin)
            parts.push(`[LinkedIn](${contactInfo.linkedin})`);
        if (contactInfo?.twitter) parts.push(`[Twitter](${contactInfo.twitter})`);
        if (contactInfo?.github) parts.push(`[GitHub](${contactInfo.github})`);
        if (contactInfo?.leetcode) parts.push(`[LeetCode](${contactInfo.leetcode})`);

        return parts.length > 0
            ? `# ${user?.fullName || 'Your Name'}\n\n<div align="center">\n${parts.join(" | ")}\n</div>`
            : `# ${user?.fullName || 'Your Name'}`;
    }

    const getCombinedContent = () => {
        const { summary, skills, experience, education, projects } = formValues || {}
        return [
            getContactMarkdown(),
            summary && `## Professional Summary\n\n${summary}`,
            skills && `## Skills\n\n${skills}`,
            experience && experience.length > 0 && entriesToMarkdown({ entries: experience, type: "Work Experience" }),
            education && education.length > 0 && entriesToMarkdown({ entries: education, type: "Education" }),
            projects && projects.length > 0 && entriesToMarkdown({ entries: projects, type: "Projects" })
        ]
            .filter(Boolean)
            .join("\n\n")
    }

    const onSubmit = async () => {
        try {
            const formattedContent = previewContent
                .replace(/\n/g, "\n") // Normalize newlines
                .replace(/\n\s*\n/g, "\n\n") // Normalize multiple newlines to double newlines
                .trim();

            console.log(previewContent, formattedContent);
            await saveResumeFn(previewContent);
        } catch (error) {
            console.error("Save error:", error);
        }
    };
    const generatePDF = async () => {
        // Ensure we're on the client side
        if (typeof window === 'undefined') {
            toast.error("PDF generation is only available on the client side");
            return;
        }

        setIsGenerating(true);
        try {
            // @ts-ignore - Dynamic import types
            const html2canvas = (await import("html2canvas")).default;
            // @ts-ignore - Dynamic import types
            const jsPDF = (await import("jspdf")).jsPDF;
            
            // Create an isolated iframe to render the markdown without CSS conflicts
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';
            iframe.style.top = '-9999px';
            iframe.style.width = '794px';
            iframe.style.height = '1123px';
            document.body.appendChild(iframe);
            
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) throw new Error("Could not access iframe document");
            
            // Write clean HTML with inline styles to the iframe
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                        
                        * { 
                            margin: 0; 
                            padding: 0; 
                            box-sizing: border-box; 
                        }
                        
                        body { 
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            line-height: 1.5; 
                            color: #2d3748; 
                            background: white;
                            padding: 50px 40px;
                            font-size: 11px;
                            font-weight: 400;
                        }
                        
                        h1 { 
                            font-size: 32px; 
                            font-weight: 700; 
                            margin: 0 0 8px 0; 
                            text-align: center;
                            color: #1a202c;
                            letter-spacing: -0.5px;
                        }
                        
                        h2 { 
                            font-size: 18px; 
                            font-weight: 600; 
                            margin: 24px 0 12px 0; 
                            color: #2d3748;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            border-bottom: 2px solid #4299e1;
                            padding-bottom: 4px;
                        }
                        
                        h3 { 
                            font-size: 14px; 
                            font-weight: 600; 
                            margin: 16px 0 6px 0; 
                            color: #2d3748;
                        }
                        
                        p { 
                            margin: 6px 0; 
                            line-height: 1.6;
                            color: #4a5568;
                        }
                        
                        .contact-info {
                            text-align: center;
                            margin: 16px 0 32px 0;
                            font-size: 12px;
                            color: #718096;
                            line-height: 1.4;
                        }
                        
                        a {
                            color: #4299e1;
                            text-decoration: none;
                            font-weight: 500;
                        }
                        
                        a:hover {
                            text-decoration: underline;
                        }
                        
                        strong { 
                            font-weight: 600; 
                            color: #2d3748;
                        }
                        
                        em { 
                            font-style: italic; 
                            color: #4a5568;
                        }
                        
                        ul, ol { 
                            margin: 8px 0; 
                            padding-left: 20px; 
                        }
                        
                        li { 
                            margin: 3px 0; 
                            line-height: 1.5;
                        }
                        
                        .job-title {
                            font-weight: 600;
                            color: #2d3748;
                            font-size: 13px;
                        }
                        
                        .job-date {
                            color: #718096;
                            font-size: 11px;
                            font-style: italic;
                            margin: 2px 0 8px 0;
                        }
                        
                        .job-description {
                            margin-left: 0;
                            color: #4a5568;
                        }
                        
                        /* Center contact info properly */
                        div[align="center"] {
                            text-align: center;
                        }
                        
                        /* Style emojis */
                        .emoji {
                            font-size: 14px;
                            margin-right: 4px;
                        }
                    </style>
                </head>
                <body>
                    <div id="resume-content"></div>
                </body>
                </html>
            `);
            iframeDoc.close();
            
            // Wait for iframe to load
            await new Promise(resolve => {
                iframe.onload = resolve;
                if (iframe.contentDocument?.readyState === 'complete') resolve(null);
            });
            
            // Convert markdown to HTML and insert into iframe
            const { marked } = await import('marked');
            let htmlContent = await marked(previewContent);
            
            // Post-process the HTML to improve formatting
            htmlContent = htmlContent
                // Fix contact info centering
                .replace(/<div align="center">/g, '<div style="text-align: center;">')
                // Improve link styling - show actual URLs for PDF
                .replace(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g, '<a href="$1" target="_blank">$2</a>')
                // Add emoji styling
                .replace(/(📧|📱|🔗)/g, '<span class="emoji">$1</span>');
            
            const contentDiv = iframeDoc.getElementById('resume-content');
            if (contentDiv) {
                //@ts-ignore
                contentDiv.innerHTML = htmlContent;
                
                // Additional DOM manipulation for better structure
                const headings = contentDiv.querySelectorAll('h2');
                headings.forEach((heading: any) => {
                    if (heading.textContent?.includes('center')) {
                        heading.style.textAlign = 'center';
                        heading.style.border = 'none';
                        heading.style.textTransform = 'none';
                        heading.style.fontSize = '32px';
                        heading.style.fontWeight = '700';
                        heading.style.margin = '0 0 8px 0';
                    }
                });
                
                // Style contact info paragraphs
                const paragraphs = contentDiv.querySelectorAll('p');
                paragraphs.forEach((p: any) => {
                    if (p.textContent?.includes('📧') || p.textContent?.includes('📱') || p.textContent?.includes('LinkedIn')) {
                        p.className = 'contact-info';
                    }
                });
            }
            
            // Wait a bit for rendering
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Capture the iframe content
            const canvas = await html2canvas(iframeDoc.body, {
                useCORS: true,
                allowTaint: true,
                  //@ts-ignore
                backgroundColor: '#ffffff',
                width: 794,
                height: 1123
            });
            
            // Remove iframe
            document.body.removeChild(iframe);
            
            // Generate PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('portrait', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;
            
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save('resume.pdf');
            
            toast.success("PDF generated successfully!");
        } catch (error) {
            console.error("PDF generation error:", error);
            toast.error("Failed to generate PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Show loading state during SSR
    if (!isMounted) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading Resume Builder...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className='flex flex-col md:flex-row justify-between items-center gap-2'>
                <h1 className='font-bold gradient-title text-5xl md:text-6xl'>Resume Builder</h1>
                <div className='space-x-2'>
                    <Button variant={"destructive"} onClick={onSubmit} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                Saving...
                            </>

                        ) : (
                            <>
                                <Save className='h-4 w-4' />
                                Save
                            </>

                        )}
                    </Button>
                    <Button onClick={generatePDF} disabled={isGenerating} >
                        {isGenerating ? (
                            <>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                Generating PDF...
                            </>

                        ) : (
                            <>
                                <Download className='h-4 w-4' />
                                Download
                            </>

                        )}

                    </Button>
                </div>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="edit">Form</TabsTrigger>
                    <TabsTrigger value="preview">Markdown</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                    <form action="" className='space-y-8' >
                        {/* conatctInfoo */}
                        <div className='space-y-8'>
                            <h3 className='text-lg font-medium'>
                                Contact Information
                            </h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50'>
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Email</Label>
                                    <Input
                                        {...register("contactInfo.email")}
                                        type="email"
                                        placeholder="your@email.com"
                                        aria-invalid={!!errors.contactInfo?.email}
                                    />
                                    {errors.contactInfo?.email && (
                                        <p className="text-sm text-red-600 ">{errors.contactInfo.email.message}</p>
                                    )}
                                </div>
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Mobile Number</Label>
                                    <Input
                                        {...register("contactInfo.mobile")}
                                        type="tel"
                                        placeholder="+1 234 567 8900"
                                        aria-invalid={!!errors.contactInfo?.mobile}
                                    />
                                    {errors.contactInfo?.mobile && (
                                        <p className="text-sm text-red-600 ">{errors.contactInfo.mobile.message}</p>
                                    )}
                                </div>
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Linkedin URL</Label>
                                    <Input
                                        {...register("contactInfo.linkedin")}
                                        type="url"
                                        placeholder="https://linkedin.com/in/your-profile"
                                        aria-invalid={!!errors.contactInfo?.linkedin}
                                    />
                                    {errors.contactInfo?.linkedin && (
                                        <p className="text-sm text-red-600 ">{errors.contactInfo.linkedin.message}</p>
                                    )}
                                </div>
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Github URL</Label>
                                    <Input
                                        {...register("contactInfo.github")}
                                        type="url"
                                        placeholder="https://github.com/your-profile"
                                        aria-invalid={!!errors.contactInfo?.github}
                                    />
                                    {errors.contactInfo?.github && (
                                        <p className="text-sm text-red-600 ">{errors.contactInfo.github.message}</p>
                                    )}
                                </div>
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Twitter/X Profile</Label>
                                    <Input
                                        {...register("contactInfo.twitter")}
                                        type="url"
                                        placeholder="https://twitter.com/your-handle"
                                        aria-invalid={!!errors.contactInfo?.twitter}
                                    />
                                    {errors.contactInfo?.twitter && (
                                        <p className="text-sm text-red-600 ">{errors.contactInfo.twitter.message}</p>
                                    )}
                                </div>
                                <div className='space-y-2'>
                                    <Label className='text-sm font-medium'>Leetcode URL</Label>
                                    <Input
                                        {...register("contactInfo.leetcode")}
                                        type="url"
                                        placeholder="https://leetcode.com/your-profile"
                                        aria-invalid={!!errors.contactInfo?.leetcode}
                                    />
                                    {errors.contactInfo?.leetcode && (
                                        <p className="text-sm text-red-600 ">{errors.contactInfo.leetcode.message}</p>
                                    )}
                                </div>

                            </div>

                        </div>
                        {/* ProfessionalSummary */}

                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>
                                Professional Summary
                            </h3>
                            <Controller
                                name='summary'
                                control={control}
                                render={({ field }) => (

                                    <Textarea
                                        {...field}
                                        className="h-32"
                                        placeholder='Write a compelling professional summary...'
                                        aria-invalid={!!errors.summary}
                                    />
                                )}
                            />
                            {errors.summary && (
                                <p className="text-sm text-red-600 ">{errors.summary.message}</p>
                            )}
                        </div>
                        {/* skills */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>
                                Skills
                            </h3>
                            <Controller
                                name='skills'
                                control={control}
                                render={({ field }) => (

                                    <Textarea
                                        {...field}
                                        className="h-32"
                                        placeholder='List your key skills...'
                                        aria-invalid={!!errors.skills}
                                    />
                                )}
                            />
                            {errors.skills && (
                                <p className="text-sm text-red-600 ">{errors.skills.message}</p>
                            )}
                        </div>
                        {/* experience */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>
                                Work Experience
                            </h3>
                            <Controller
                                name='experience'
                                control={control}
                                render={({ field }) => (

                                    <EntryForm
                                        type="experience"
                                        entries={field.value}
                                        onChange={field.onChange} />
                                )}
                            />
                            {errors.experience && (
                                <p className="text-sm text-red-600 ">{errors.experience.message}</p>
                            )}
                        </div>
                        {/* education */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>
                                Education
                            </h3>
                            <Controller
                                name='education'
                                control={control}
                                render={({ field }) => (

                                    <EntryForm
                                        type="education"
                                        entries={field.value}
                                        onChange={field.onChange} />

                                )}
                            />
                            {errors.education && (
                                <p className="text-sm text-red-600 ">{errors.education.message}</p>
                            )}
                        </div>
                        {/* PROJECTS */}
                        <div className='space-y-4'>
                            <h3 className='text-lg font-medium'>
                                Projects
                            </h3>
                            <Controller
                                name='projects'
                                control={control}
                                render={({ field }) => (
                                    <EntryForm
                                        type="projects"
                                        entries={field.value}
                                        onChange={field.onChange} />

                                )}
                            />
                            {errors.projects && (
                                <p className="text-sm text-red-600 ">{errors.projects.message}</p>
                            )}
                        </div>


                    </form>
                </TabsContent>
                <TabsContent value="preview">
                    <Button onClick={() => setResumeMode(resumeMode === "preview" ? "edit" : "preview")} variant={"link"} type="button" className='mb-2'>
                        {resumeMode === "preview" ? (
                            <><Edit className='h-4 w-4' />
                                Edit Resume</>

                        ) : (
                            <><Monitor className='h-4 w-4' />
                                Show Preview</>
                        )}


                    </Button>
                    {resumeMode !== "preview" && (
                        <div className='flex p-3 gap-2 items-center border-2 border-yellow-600 text-yellow-600 rounded mb-2'>
                            <AlertTriangle className='h-5 w-5' />
                            <span className='text-sm'>You will lose editorial markdown if you update the form data.</span>
                        </div>
                    )}

                    <div className='border rounded-lg'>
                        <MDEditor
                            value={previewContent}
                            onChange={setPreviewContent}
                            height={800}
                            //@ts-ignore
                            preview={resumeMode}
                        />

                    </div>




                </TabsContent>
            </Tabs>
        </div>
    )
}

export default ResumeBuilder