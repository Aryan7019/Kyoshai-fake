"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { IndustryInsight, User, MarketOutlook, DemandLevel, Prisma } from "@prisma/client";
import { _success } from "zod/v4/core";
import { generateAIInsight } from "./dashboard";

export async function updateUser(data: User) {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId
    }
  });

  if (!user) throw new Error("User not found");

  try {
    // Check if industry insight exists first (outside transaction)
    let industryInsight: IndustryInsight | null = null;
    let needsInsightCreation = false;

    if (data.industry) {
      industryInsight = await db.industryInsight.findUnique({
        where: {
          industry: data.industry
        }
      });

      needsInsightCreation = !industryInsight;
    }

    // Generate AI insights outside transaction if needed
    let insights = null;
    if (needsInsightCreation && data.industry) {
      try {
        insights = await generateAIInsight(data.industry);
      } catch (aiError: any) {
        console.log("AI insight generation failed, continuing with user update:", aiError.message);
        // Continue with user update even if AI fails
      }
    }

    // Now do the database transaction
    const result = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create industry insight if we have the data
      if (insights && data.industry) {
        industryInsight = await tx.industryInsight.create({
          data: {
            industry: data.industry,
            ...insights,
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
          }
        });
      }

      // Update user
      const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          industry: data.industry,
          experience: data.experience,
          bio: data.bio,
          skills: data.skills,
        }
      });

      return { user: updatedUser, industryInsight };
    }, {
      timeout: 10000 // Reduced timeout since AI is outside
    });

    return { success: true, ...result }
  } catch (error: any) {
    console.log("Error updating user and industry:", error.message);
    console.error("Full error:", error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
}
export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("User not authenticated");

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId
    }
  });

  if (!user) throw new Error("User not found");
  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId
      },
      select: {
        industry: true,
      }
    })
    return {
      isOnboarded: !!user?.industry
    }
  } catch (err: any) {
    console.log("Error fetching user onboarding status:", err.message);
    throw new Error("Failed to fetch user onboarding status");
  }
}