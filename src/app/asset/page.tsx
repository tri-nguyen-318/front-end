"use client";
import { TypoH2 } from "@/components/typography/typoH2";
import { TypoP } from "@/components/typography/typoP";
import { Button } from "@/components/ui/button";
import React from "react";
import AssetList from "./components/AssetList";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const analyzeAssets = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/assets/analyze`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("not-detected");
    }

    throw new Error(`Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

export default function VideoUploadPage() {
  const { mutate } = useMutation({
    mutationFn: analyzeAssets,
    onSuccess: () => {
      toast.success("Analysis completed successfully");
    },
    onError: (error) => {
      // check status code
      if (error instanceof Error && error.message.includes("not-detected")) {
        toast.error(`Not detected your brand in provided video`);
        return;
      }

      return toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    },
  });

  const onAnalysis = () => {
    mutate();
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <TypoH2>Assets</TypoH2>
          <TypoP>
            This is the analysis page for the uploaded video and images.
            <span>Detected brand exposure time in seconds</span>
          </TypoP>
        </div>

        <Button onClick={onAnalysis}>Analysis</Button>
      </div>

      <div>
        <AssetList />
      </div>
    </div>
  );
}
