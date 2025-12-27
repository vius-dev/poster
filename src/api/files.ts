
// src/api/files.ts

// This file will contain a stub for the files API.
// It will be extended with API calls for file uploads and downloads.

export const uploadFile = async (file: any): Promise<string> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Mock uploading file:', file.name || 'unknown');

  // Return a random high-quality image from Picsum
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/id/${randomId}/800/600`;
};
