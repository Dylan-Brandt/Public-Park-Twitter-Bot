import { writeFile } from 'fs/promises';

export async function saveBlobPhoto(path, blobToSave) {
  try {
    writeFile(path, blobToSave);
  } catch (err) {
    console.error(err);
  }
}
