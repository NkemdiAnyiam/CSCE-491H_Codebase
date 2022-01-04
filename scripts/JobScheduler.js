const genNewJobCard = (cardData) => {
  const {cardNum, SJNum, weight, cEntry, nextSJNum} = cardData;
  const templateCardId = "job-card-template";
  const resultCardTemplate = document.getElementById(templateCardId);
  const cloneCard = document.importNode(resultCardTemplate.content, true);

  const jobCardEl = cloneCard.querySelector('.job-card');
  const SJNumEls = cloneCard.querySelectorAll('.SJ-num');
  const weightEl = cloneCard.querySelector('.weight');
  const cEntryEl = cloneCard.querySelector('.c-entry');

  const nextSJNumEl = cloneCard.querySelector('.next-SJ-num');

  jobCardEl.dataset.cardnum = `${cardNum}`;
  SJNumEls.forEach((el) => {
    el.textContent = SJNum;
  });
  weightEl.textContent = weight;
  cEntryEl.textContent = cEntry;
  nextSJNumEl.textContent = nextSJNum;

  return jobCardEl;
};

const setCardCompResults1 = (card, cardData) => {
  const {OPTResult, computationResult} = cardData;

  const OPTResult1El = card.querySelector('.computation--1 .OPT-result');
  const computationResult1El = card.querySelector('.computation--1 .computation-result');

  OPTResult1El.textContent = OPTResult;
  computationResult1El.textContent = computationResult;
};

const setCardCompResults2 = (card, cardData) => {
  const {OPTResult, computationResult} = cardData;

  const OPTResult2El = card.querySelector('.computation--2 .OPT-result');
  const computationResult2El = card.querySelector('.computation--2 .computation-result');

  OPTResult2El.textContent = OPTResult;
  computationResult2El.textContent = computationResult;
};

const setCardFormulaResults = (card, cardData) => {
  const {formulaResult} = cardData;

  const formulaResultEl = card.querySelector('.formula-result');
  const MEntryEl = card.querySelector('.M-entry');
  formulaResultEl.textContent = formulaResult;
  MEntryEl.textContent = formulaResult;
};


const genNewJobStub = (cardData) => {
  const {cardNum, SJNum, MEntry} = cardData;

  const templateCardId = "job-stub-template";
  const resultCardTemplate = document.getElementById(templateCardId);
  const cloneCard = document.importNode(resultCardTemplate.content, true);

  const jobCardEl = cloneCard.querySelector('.job-card');
  const SJNumEls = cloneCard.querySelectorAll('.SJ-num');
  const MEntryEl = cloneCard.querySelector('.M-entry');

  jobCardEl.dataset.cardnum = `${cardNum}`;
  SJNumEls.forEach((el) => {
    el.textContent = SJNum;
  });
  MEntryEl.textContent = MEntry;

  return jobCardEl;
};


export class JobScheduler {
  _maxTime = 0;
  _c = [];
  _M = [];
  static nextCardNum = 1;

  constructor(jobs = []) {
    this._jobs = jobs;
    this._n_jobs = jobs.length;
  }

  getNumJobs() { return this._n_jobs; }
  getMaxTime() { return this._maxTime; }
  getJobs() { return [...this._jobs]; }

  addJob(job) { 
    this._jobs.push(job);
    this._n_jobs++;
    this._maxTime = Math.max(this._maxTime, job.getFinish());
  }

  addJobs(jobs) {
    jobs.forEach(job => this.addJob(job));
  }

  jobFinishComparator(job1, job2) {
    if (job1.getFinish() <= job2.getFinish()) { return -1; }
    else { return 1; }
  }

  sortJobsByFinish() {
    this._jobs.sort(this.jobFinishComparator);
    this._jobs.forEach((job, index) => {
      job.setSortedJobNum(index + 1);
    });
  }

  setupTimeGraph() {
    // Set up row template and time row to make sure they have proper number of cells
    const templateRowId = 'time-graph__row-template';
    const resultRowTemplateEl = document.getElementById(templateRowId);
    const rowTemplateRow = resultRowTemplateEl.content.querySelector('.time-graph__row');
    const timesRow = document.querySelector('.time-graph__row--times');

    for (let i = 0; i <= Math.ceil(this.getMaxTime()); ++i) {
      const cell = document.createElement('div');
      rowTemplateRow.append(cell);
      cell.outerHTML = `<div class="time-graph__cell time-graph__cell--${i}"></div>`;

      const timeCell = document.createElement('div');
      timesRow.append(timeCell);
      timeCell.outerHTML = `<div class="time-graph__cell time-graph__cell--${i}"><span>${i}</span></div>`;
    }

    

    // Generate job bars
    const jobBarsEl = document.querySelector('.time-graph__job-bars');
    this._jobs.forEach((job, i) => {
      const jobBar = job.generateJobBar();
      jobBarsEl.append(jobBar);

      const cloneRow = document.importNode(resultRowTemplateEl.content, true);
      const timeGraphRow = cloneRow.querySelector('.time-graph__row');
      const rowSJNum = cloneRow.querySelector('.time-graph__SJ-num');
      const rowLetter_unsorted = cloneRow.querySelector('.time-graph__job-letter--unsorted');
      const rowLetter_sorted = cloneRow.querySelector('.time-graph__job-letter--sorted');

      timeGraphRow.classList.add(`time-graph__row--${i}`);
      rowSJNum.textContent = `j=${i+1}`;
      rowLetter_unsorted.textContent = `Job ${String.fromCharCode(i + 65)}`;
      rowLetter_sorted.textContent = `Job ${job.getJobLetter()}`;

      timesRow.before(timeGraphRow);
    });
  }

  setCompatibleJobNums() {
    this._c.push(null); // TODO: potentially clear before starting
    this._jobs.forEach(job => {
      const compatibleJobNum = job.findCompatibleJobNum(this._jobs);
      // job.setCompatibleJobNum(compatibleJobNum);
      this._c.push(compatibleJobNum);
    });
  }

  initializeM() {
    this._M[0] = 0;
    for (let i = 1; i <= this._n_jobs; ++i) {
      this._M[i] = null;
    }
  }

  computeOPT(j, parentContainer) {
    if (this._M[j] === null) {
      const cardData = {
        cardNum: JobScheduler.nextCardNum++,
        SJNum: this._jobs[j-1].getSortedJobNum(),
        weight: this._jobs[j-1].getWeight(),
        cEntry: this._c[j],
        nextSJNum: (j - 1),
      };
      // const newCard = genNewJobCard(cardData);
      // parentContainer.append(newCard);
      const childrenContainer = null;

      const computationResult1 = this._jobs[j-1].getWeight() + this.computeOPT(this._c[j], childrenContainer); // assuming this job is part of optimal set
      const computation1Data = {
        OPTResult: computationResult1 - this._jobs[j-1].getWeight(),
        computationResult: computationResult1,
      };
      // setCardCompResults1(newCard, computation1Data);

      const computationResult2 = this.computeOPT(j - 1, childrenContainer); // assuming this job is NOT part of optimal set
      const computation2Data = {
        OPTResult: computationResult2,
        computationResult: computationResult2,
      };
      // setCardCompResults2(newCard, computation2Data);

      this._M[j] = Math.max(computationResult1, computationResult2);
      const formulaResultData = {
        formulaResult: this._M[j],
      }
      // setCardFormulaResults(newCard, formulaResultData);
      // console.log(newCard);
      // console.log(childrenContainer);
    }
    else {
      const cardData = {
        cardNum: JobScheduler.nextCardNum++,
        SJNum: this._jobs[j-1]?.getSortedJobNum() || 0,
        MEntry: this._M[j],
      };
      // const newStub = genNewJobStub(cardData);
      // parentContainer.append(newStub);
    }
    return this._M[j]
  }

  toStr() {
    let thisString = ``;
    thisString += `c array:\n\t${this._c}\n`;
    thisString += `M array:\n\t${this._M}\n`;
    thisString += `Jobs:\n`
    this._jobs.forEach(job => {
      thisString += `\t${job.toStr()}\n`;
    });
    return thisString;
  }
  
 print() {
    console.log(this.toStr());
  }
}
