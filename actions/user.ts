"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { IndustryInsight, User, MarketOutlook, DemandLevel } from "@prisma/client";
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
    const result = await db.$transaction(async (tx) => {
      // Only process industry insight if industry is provided
      let industryInsight = null;

      if (data.industry) {
        industryInsight = await tx.industryInsight.findUnique({
          where: {
            industry: data.industry // Now this is definitely a string
          }
        });

        // Create industry insight if it doesn't exist
        if (!industryInsight) {
          const insights = await generateAIInsight(data.industry);
          industryInsight = await tx.industryInsight.create({
            data: {
              industry: data.industry,
              ...insights,
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
            }
          });
        }
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
      timeout: 30000
    });

    return { success: true, ...result }
  } catch (error: any) {
    console.log("Error updating user and industry:", error.message);
    throw new Error("Failed to update user");
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