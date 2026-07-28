import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

async function uploadSingleFile(
  file: File,
  userId: string,
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(
      `Invalid file type '${file.type}'. Only image files (JPEG, PNG, WebP, GIF) are allowed.`,
    );
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File is ${sizeMB}MB. Maximum allowed size is 5MB.`);
  }

  if (file.size === 0) {
    throw new Error("The uploaded file is empty.");
  }

  const timestamp = Date.now();
  const ext = file.name.split(".").pop() ?? "jpg";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50);
  const pathname = `community/${userId}/${timestamp}-${safeName}`;

  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
}

export async function POST(request: Request): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "You must be signed in to upload files." },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error:
          "Invalid form data. Please send a multipart/form-data request with 'files' (multiple) or 'file' fields.",
      },
      { status: 400 },
    );
  }

  const filesAll = formData.getAll("files");
  const fileSingle = formData.get("file");

  const filesToUpload: File[] = [];

  if (filesAll.length > 0) {
    for (const f of filesAll) {
      if (f instanceof File) filesToUpload.push(f);
    }
  } else if (fileSingle instanceof File) {
    filesToUpload.push(fileSingle);
  }

  if (filesToUpload.length === 0) {
    return NextResponse.json(
      {
        error:
          "No files provided. Please attach image files with the field name 'files' (multiple) or 'file' (single).",
      },
      { status: 400 },
    );
  }

  if (filesToUpload.length > 10) {
    return NextResponse.json(
      { error: "Maximum of 10 images per post." },
      { status: 400 },
    );
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of filesToUpload) {
    try {
      const url = await uploadSingleFile(file, userId);
      urls.push(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      errors.push(`${file.name}: ${msg}`);
    }
  }

  if (urls.length === 0 && errors.length > 0) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 400 });
  }

  return NextResponse.json({ urls, errors: errors.length > 0 ? errors : undefined });
}
