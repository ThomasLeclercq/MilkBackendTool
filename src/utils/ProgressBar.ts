export class ProgressBar {

  private _current: number = 0;
  private _total: number = 1;
  private _progress: number = 0;

  private _loaderIcon: string[] = [ "[|]", "[/]", "[-]", "[\\]" ];
  private _loaderPosition: number = 0;

  private _averageCompletionTimeDisplay: string;
  private _completionTimeSamples: number[] = [];
  private _averageCompletionTime: number = 0;
  private _lastCompletionTime: number = 0;

  private _loaderInterval: NodeJS.Timer;

  constructor(total: number, current: number = 0) {
    if (!total || total == 0) {
      throw new Error("ProgressBar constructor - total cannot be null")
    }
    this._total = total;
    this._current = current;
    this._progress = current;
    
    this._loaderInterval = setInterval( () => {
      this._updateLoaderIcon();
    }, 500);
  }

  progress(progress: number = 1) {
    this._current += progress;
    this._progress = this._total !== 0 ? (this._current / this._total) : 0;
    this._estimateCompletionTime();
    this._displayProgressBar();
    if (this._loaderInterval !== undefined && this._progress === 1) {
      clearInterval(this._loaderInterval);
    }
  }

  /**
   * Display Progress Bar
   * Display current progression of task based on total number of action expected and current number of action already completed.
   */
  private _displayProgressBar() {
    const max = 100;
    const min = Math.round(max * this._progress);
    if (min <= max) {
      const dots = ".".repeat(min);
      const empty = " ".repeat(max - min);
      process.stdout.write(`\r[${dots}${empty}] ${(this._progress*100).toFixed(2)}% - ${this._loaderIcon[this._loaderPosition]} - EstimatedTime: ${this._averageCompletionTimeDisplay} - Avg: ${this._averageCompletionTime.toFixed(1)}ms`);
    }
  }

  /**
   * Update Loader Icon
   * Shows that the program is active, even if there no progression
   * Useful if your task takes time to complete one action
   */
  private _updateLoaderIcon() {
    this._loaderPosition += 1;
    if (this._loaderPosition > this._loaderIcon.length-1) {
      this._loaderPosition = 0;
    }
    this._displayProgressBar();
  }

  private _estimateCompletionTime() {

    // Collect Completion time for average calculation
    if (this._lastCompletionTime && this._completionTimeSamples.length < Math.floor(this._total * 0.01)) {
      const now = Date.now();
      const mllsTillLastProgressEvent = now - this._lastCompletionTime;
      this._completionTimeSamples.push(mllsTillLastProgressEvent);
      // Get Average time to complete from a 1% sample 
      this._averageCompletionTime = this._completionTimeSamples.reduce( (prev, current) => (prev+current), 0) / this._completionTimeSamples.length;
    }

    // Display expected remaining time
    const remainingEvents = this._total - this._current;
    const expectedCompletionTimeInMl = this._averageCompletionTime * remainingEvents;

    const millisecondDate = new Date(expectedCompletionTimeInMl);
    const hours = String(millisecondDate.getUTCHours()).padStart(2, '0');
    const minutes = String(millisecondDate.getUTCMinutes()).padStart(2, '0');
    const seconds = String(millisecondDate.getUTCSeconds()).padStart(2, '0');
    this._averageCompletionTimeDisplay = `${hours}:${minutes}:${seconds}`;
    
    this._lastCompletionTime = Date.now();
  }
}