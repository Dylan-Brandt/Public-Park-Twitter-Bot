import { writeFile } from 'fs/promises';

export async function saveFile(path, content) {
  try {
    writeFile(path, content);
  } catch (err) {
    console.error(err);
  }
}

export function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

