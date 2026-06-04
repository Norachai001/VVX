import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Storage Abstraction
 * Currently saves files locally to `public/uploads`.
 * This can be swapped out to use AWS S3, Cloudinary, etc., without changing the callers.
 */
export async function uploadFile(file: File, prefix: string): Promise<{ name: string; url: string }> {
  if (!file.name) {
    throw new Error("File has no name");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const filename = `${Date.now()}-${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  
  // Local storage strategy
  const uploadDir = path.join(process.cwd(), "public", "uploads", prefix);
  
  try {
    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });
  } catch (err) {
    // Ignore error if directory already exists
  }

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  // Return the public URL to access the file
  return {
    name: file.name,
    url: `/uploads/${prefix}/${filename}`,
  };
}
