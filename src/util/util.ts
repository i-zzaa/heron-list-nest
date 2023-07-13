export function removeStringRepeted(array, propriedade) {
  const uniqueObjects = [];
  const uniqueStrings = new Set();

  for (let i = 0; i < array.length; i++) {
    const objeto = array[i];
    const string = objeto[propriedade];

    if (!uniqueStrings.has(string)) {
      uniqueStrings.add(string);
      uniqueObjects.push(objeto);
    }
  }

  return uniqueObjects;
}
