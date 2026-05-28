import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import config from "@/lib/config";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Scan database for user creations in "processing" state
    const processingCreations = await prisma.fitnessCreation.findMany({
      where: {
        userId: session.user.id,
        status: "processing"
      }
    });

    // 2. Perform self-healing synchronization for each pending creation
    const apiKey = config.ai.banana.apiKey;
    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      const syncPromises = processingCreations.map(async (creation) => {
        if (!creation.requestId) return;
        try {
          const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${creation.requestId}/result`, {
            headers: { "x-api-key": apiKey }
          });

          if (pollRes.ok) {
            const pollJson = await pollRes.json();
            const status = pollJson.status;

            if (status === "completed" || status === "succeeded") {
              const outputs = pollJson.outputs || [];
              const outputUrl = outputs.length > 0 ? outputs[0] : null;

              await prisma.fitnessCreation.update({
                where: { id: creation.id },
                data: {
                  status: "completed",
                  resultImage: outputUrl,
                }
              });
            } else if (status === "failed") {
              await prisma.fitnessCreation.update({
                where: { id: creation.id },
                data: {
                  status: "failed",
                  error: pollJson.error || "Generation failed.",
                }
              });
            }
          }
        } catch (err) {
          console.error(`[SYNC_CREATION_FAILED] for ${creation.id}:`, err);
        }
      });

      await Promise.all(syncPromises);
    }

    // 3. Fetch final sorted creations list
    const creations = await prisma.fitnessCreation.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(creations);
  } catch (error) {
    console.error("Fetch creations error:", error);
    return NextResponse.json({ error: "Failed to fetch creations" }, { status: 500 });
  }
}
