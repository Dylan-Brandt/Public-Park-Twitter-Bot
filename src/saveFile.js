import { writeFile } from 'fs/promises';

export async function saveFile(path, content) {
  try {
    writeFile(path, content);
  } catch (err) {
    console.error(err);
  }
}

