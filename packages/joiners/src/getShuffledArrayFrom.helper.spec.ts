export function getShuffledArrayFrom<ArrayElement>(
  sourceArray: ArrayElement[],
): ArrayElement[] {
  const resultArray = [...sourceArray];
  let currentIndex = resultArray.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [resultArray[currentIndex], resultArray[randomIndex]] = [
      resultArray[randomIndex]!,
      resultArray[currentIndex]!,
    ];
  }

  return resultArray;
}
