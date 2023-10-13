export abstract class ArrayHelper {
  static getBatchesFromArray(array: any[], batchSize: number = 100): any[][] {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }
}