import config from "@/lib/config";
import { UserService } from "./user";
import { prisma } from "@/lib/prisma";

/**
 * Service to manage AI Fitness simulator predictions.
 */
export const AIService = {
  /**
   * Calculate credit cost based on resolution
   */
  getCreditCost(resolution) {
    switch (resolution) {
      case "4k": return 36;
      case "2k": return 24;
      case "1k":
      default: return 24;
    }
  },

  /**
   * Execute an edit quest using muapi.ai
   */
  async edit(userId, { prompt, inputImage, aspectRatio = "Auto", resolution = "1k" }) {
    if (!inputImage) throw new Error("An input image is required.");
    
    const cost = this.getCreditCost(resolution);
    await UserService.deductCredits(userId, cost);

    const apiKey = config.ai.banana.apiKey;
    if (!apiKey) throw new Error("MUAPIAPP_API_KEY is not configured");

    const webhookUrl = `${config.auth.webhook_url}/api/webhook/muapi`;
    const submitUrl = `https://api.muapi.ai/api/v1/nano-banana-2-edit?webhook=${encodeURIComponent(webhookUrl)}`;
    
    // We send images_list as [inputImage] - strictly single image
    const bodyPayload = {
      prompt,
      images_list: [inputImage],
      aspect_ratio: aspectRatio,
      resolution,
    };

    const submitRes = await fetch(submitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(bodyPayload),
    });

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      throw new Error(`API Submission Failed: ${submitRes.status} ${errorText}`);
    }

    const { request_id } = await submitRes.json();
    if (!request_id) throw new Error("No request_id received from API");

    // Save to the database
    const creation = await prisma.fitnessCreation.create({
      data: {
        userId,
        prompt,
        inputImage,
        aspectRatio,
        resolution,
        requestId: request_id,
        status: "processing",
        creditCost: cost,
      }
    });

    return { request_id, id: creation.id };
  },

  /**
   * Check status of a request and save to DB on completion
   */
  async checkStatus(requestId, userId) {
    const creation = await prisma.fitnessCreation.findUnique({
      where: { requestId }
    });

    if (!creation) {
      return { status: "not_found" };
    }

    if (creation.status === "completed") {
      return { status: "completed", imageUrl: creation.resultImage };
    }

    if (creation.status === "failed") {
      return { status: "failed", error: creation.error };
    }

    // If still processing, call upstream to see if it's done (self-healing / fallback)
    const apiKey = config.ai.banana.apiKey;
    if (!apiKey) return { status: "processing" };

    try {
      const pollRes = await fetch(`https://api.muapi.ai/api/v1/predictions/${requestId}/result`, {
        headers: { "x-api-key": apiKey }
      });

      if (pollRes.ok) {
        const pollJson = await pollRes.json();
        const status = pollJson.status;

        if (status === "completed" || status === "succeeded") {
          const outputs = pollJson.outputs || [];
          const outputUrl = outputs.length > 0 ? outputs[0] : null;

          const updated = await prisma.fitnessCreation.update({
            where: { id: creation.id },
            data: {
              status: "completed",
              resultImage: outputUrl,
            }
          });
          return { status: "completed", imageUrl: updated.resultImage };
        } else if (status === "failed") {
          const updated = await prisma.fitnessCreation.update({
            where: { id: creation.id },
            data: {
              status: "failed",
              error: pollJson.error || "Generation failed.",
            }
          });
          return { status: "failed", error: updated.error };
        }
      }
    } catch (err) {
      console.error("[STATUS_CHECK_ERROR]", err);
    }

    return { status: "processing" };
  }
};
