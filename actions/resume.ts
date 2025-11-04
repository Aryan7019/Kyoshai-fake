"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-preview-09-2025"
})
export async function saveResume(content: any) {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");

    const user = await db.user.findUnique({
        where: {
            clerkUserId: userId
        }
    });

    if (!user) throw new Error("User not found");
    try {
        const resume = await db.resume.upsert({
            where: {
                userId: user.id
            },
            update: {
                userId: user.id,
                content
            },
            create: {
                userId: user.id,
                content
            }
        })
        revalidatePath("/resume")
    } catch (error: any) {
        console.log("Error saving resume:", error.message);
        throw new Error("Failed to save resume");
    }
}

export async function getResume(){
     const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId
    }
  });

  if (!user) throw new Error("User not found");
  return await db.resume.findUnique({
    where:{
        userId:user.id
    }
  })
}

export async function improveWithAi({ current, type, organization, title }: any) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId
    }
  });

  if (!user) throw new Error("User not found");
  
  const prompt = `
    As an expert resume writer and career coach, improve the following ${type} description${title ? ` for "${title}"` : ''}${organization ? ` at ${organization}` : ''}.
    
    Current content: "${current}"
    
    Please enhance this description by making it more impactful and professional. Focus on:
    
    **For ALL ${type} entries:**
    1. Use powerful, appropriate action verbs
    2. Include quantifiable achievements and results where possible
    3. Highlight relevant skills and competencies
    4. Focus on impact and accomplishments
    5. Use industry-appropriate language
    6. Maintain clear, professional tone
    7. Structure for readability and scannability
    
    **${type === 'experience' ? 'EXPERIENCE-SPECIFIC:' : ''}**
    ${type === 'experience' ? `
    - Emphasize professional achievements and responsibilities
    - Show business impact and value delivered
    - Highlight leadership, collaboration, and technical skills
    - Demonstrate progression and career growth
    - Include metrics (revenue, efficiency, team size, etc.)
    ` : ''}
    
    **${type === 'education' ? 'EDUCATION-SPECIFIC:' : ''}**
    ${type === 'education' ? `
    - Focus on academic achievements and relevant coursework
    - Highlight projects, research, or thesis work
    - Emphasize skills gained and knowledge applied
    - Include honors, awards, or special recognition
    - Show relevance to career goals and ${user.industry} industry
    ` : ''}
    
    **${type === 'projects' ? 'PROJECTS-SPECIFIC:' : ''}**
    ${type === 'projects' ? `
    - Detail technical implementation and challenges solved
    - Highlight technologies, frameworks, and tools used
    - Showcase problem-solving and innovation
    - Include project scope, impact, and outcomes
    - Demonstrate collaboration and project management skills
    ` : ''}
    
    ${organization ? `**Organization Context:** Consider ${organization}'s relevance and reputation in the ${user.industry} industry.` : ''}
    
    **Format Requirements:**
    - Return only the improved description text
    - Use professional, concise language
    - Maintain the original meaning while enhancing impact
    - Structure appropriately for ${type} entries
    - Avoid markdown formatting or bullet points if not in original
    
    **Important:** Only return the improved description text without any additional explanations or headers.
  `;
  
  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    const improvedContent = response.text().trim()
    return improvedContent
  } catch (err: any) {
    console.log("Error improving content:", err.message);
    throw new Error("Failed to improve content");
  }
}