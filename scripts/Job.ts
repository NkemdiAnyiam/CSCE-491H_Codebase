export class Job {
  private static currJobLetter = 'A';

  private jobLetter: string;
  private sortedJobNum = -1;
  private compatibleJobNum = -1;

  constructor(private start: number, private finish: number, private weight: number) {
    this.jobLetter = Job.currJobLetter;
    Job.currJobLetter = String.fromCharCode( Job.currJobLetter.charCodeAt(0) + 1 );
  }

  getJobLetter() { return this.jobLetter; }
  getStart() { return this.start; }
  getFinish() { return this.finish; }
  getDuration() { return this.finish - this.start; }
  getWeight() { return this.weight; }
  getSortedJobNum() { return this.sortedJobNum; }
  getCompatibleJobNum() { return this.compatibleJobNum; }

  setCompatibleJobNum(compatibleJobNum: number) { this.compatibleJobNum = compatibleJobNum; }
  setSortedJobNum(sortedJobNum: number) { this.sortedJobNum = sortedJobNum; }

  toStr(): string {
    return `jobLetter: ${this.jobLetter}; sortedNum: ${this.sortedJobNum}, start: ${this.start}, finish: ${this.finish}, weight: ${this.weight}`;
  }

  print(): void {
    console.log(this.toStr());
  }
}
