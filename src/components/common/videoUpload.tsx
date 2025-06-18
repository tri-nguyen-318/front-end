"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { v4 } from "uuid";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { toast } from "sonner";
import { Progress } from "../ui/progress";

const formSchema = z.object({
  file: z // Changed from 'files' to 'file' since we only accept one
    .custom<File>()
    .refine((file) => file instanceof File, {
      message: "Please select a file",
    })
    .refine((file) => (file?.type || "").startsWith("video/"), {
      message: "Only video files are allowed",
    }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SingleVideoUpload() {
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [isUploading, setIsUploading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined, // Initialize with undefined instead of empty array
    },
  });

  const onSubmit = React.useCallback(async (data: FormValues) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Split the video into segments
      const segments = await splitVideo(data.file);
      console.log("Segments:", segments);
      const fileId = v4();

      let uploadedCount = 0;

      // Upload segments sequentially to maintain order and better track progress
      for (const [index, segment] of segments.entries()) {
        const formData = new FormData();
        formData.append("file", segment.blob, segment.name);
        formData.append("fileId", fileId);
        formData.append("segmentIndex", String(index));
        formData.append("totalSegments", String(segments.length));

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/video`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error(`Upload failed for segment ${index + 1}`);
          }

          uploadedCount++;
          setUploadProgress((uploadedCount / segments.length) * 100);
        } catch (error) {
          console.error(`Error uploading segment ${index + 1}:`, error);
          throw error;
        }
      }

      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      const err = error as Error;
      toast.error(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, []);

  async function splitVideo(
    file: File
  ): Promise<Array<{ blob: Blob; name: string; size: number }>> {
    const SEGMENT_SIZE = 2 * 1024 * 1024; // 2MB chunks (adjust as needed)
    const segments = [];
    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + SEGMENT_SIZE);
      const chunkNumber: number = segments.length + 1;

      segments.push({
        blob: chunk,
        name: `${file.name.replace(
          /\.[^/.]+$/,
          ""
        )}_part${chunkNumber}.${file.name.split(".").pop()}`,
        size: chunk.size,
      });

      offset += SEGMENT_SIZE;
    }

    return segments;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md">
        <FormField
          control={form.control}
          name="file" // Changed from 'files' to 'file'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Upload</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value ? [field.value] : []} // Wrap single file in array for compatibility
                  onValueChange={(files) => field.onChange(files?.[0] || null)} // Extract single file
                  accept="video/*"
                  maxFiles={1}
                  onFileReject={(_, message) => {
                    form.setError("file", {
                      message,
                    });
                  }}
                >
                  <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
                    <CloudUpload className="size-4" />
                    Drag and drop or
                    <FileUploadTrigger asChild>
                      <Button variant="link" size="sm" className="p-0">
                        choose a video
                      </Button>
                    </FileUploadTrigger>
                    to upload
                  </FileUploadDropzone>
                  <FileUploadList>
                    {field.value && (
                      <FileUploadItem key={0} value={field.value}>
                        <FileUploadItemPreview />
                        <FileUploadItemMetadata />
                        <FileUploadItemDelete asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={(e) => {
                              e.preventDefault();
                              field.onChange(null);
                            }}
                          >
                            <X />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </FileUploadItemDelete>
                      </FileUploadItem>
                    )}
                  </FileUploadList>
                </FileUpload>
              </FormControl>
              <FormDescription>
                Upload a single video file (any size)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {isUploading && (
          <div className="mt-4 space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Uploading... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}

        <Button type="submit" className="mt-4">
          Submit
        </Button>
      </form>
    </Form>
  );
}
