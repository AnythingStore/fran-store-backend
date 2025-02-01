


export function haveSameValues(list1: number[], list2: number[]): boolean {
  if (list1.length !== list2.length) {
    return false;
  }

  const sortedList1 = [...list1].sort((a, b) => a - b);
  const sortedList2 = [...list2].sort((a, b) => a - b);

  return sortedList1.every((value, index) => value === sortedList2[index]);
}