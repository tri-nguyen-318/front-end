"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, X } from "lucide-react";
import * as React from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

const formSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select at least one file")
    .max(2, "Please select up to 2 files")
    .refine((files) => files.every((file) => file.size <= 5 * 1024 * 1024), {
      message: "File size must be less than 5MB",
      path: ["files"],
    }),
});

type FormValues = z.infer<typeof formSchema>;

export default function FileUploadBasic() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  });

  const onSubmit = React.useCallback(async (data: FormValues) => {
    const formData = new FormData();

    data.files.forEach((file) => {
      formData.append(`files`, file); // Use "files" to match NestJS @UploadedFiles()
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/images`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Upload failed");
    }

    const result = await response.json();

    toast.success("Files uploaded successfully!");
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full max-w-md">
        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Attachments</FormLabel>
              <FormControl>
                <FileUpload
                  value={field.value}
                  onValueChange={field.onChange}
                  accept="image/*"
                  maxFiles={2}
                  maxSize={5 * 1024 * 1024}
                  onFileReject={(_, message) => {
                    form.setError("files", {
                      message,
                    });
                  }}
                  multiple
                >
                  <FileUploadDropzone className="flex-row flex-wrap border-dotted text-center">
                    <CloudUpload className="size-4" />
                    Drag and drop or
                    <FileUploadTrigger asChild>
                      <Button variant="link" size="sm" className="p-0">
                        choose files
                      </Button>
                    </FileUploadTrigger>
                    to upload
                  </FileUploadDropzone>
                  <FileUploadList>
                    {field.value.map((file, index) => (
                      <FileUploadItem key={index} value={file}>
                        <FileUploadItemPreview />
                        <FileUploadItemMetadata />
                        <FileUploadItemDelete asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                          >
                            <X />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </FileUploadItemDelete>
                      </FileUploadItem>
                    ))}
                  </FileUploadList>
                </FileUpload>
              </FormControl>
              <FormDescription>
                Upload up to 2 images up to 5MB each.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="mt-4">
          Submit
        </Button>
      </form>
    </Form>
  );
}
