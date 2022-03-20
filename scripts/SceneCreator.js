export class SceneCreator {
  _nextCardNum = 1;

  constructor(jobScheduler) {
    this._jobScheduler = jobScheduler;
  }

  generateScene() {
    this._generateDataDisplay();
    this._generateCardTree();
  }

  _generateDataDisplay() {
    const jobsUnsorted = this._jobScheduler.getJobsUnsorted();
    /****************************************************** */
    // SET UP ROW TEMPLATE AND TIME ROW TO MAKE SURE THEY HAVE PROPER NUMBER OF CELLS
    /****************************************************** */
    const template_timeGraphRow = document.getElementById('time-graph__row-template');
    const rowTemplateRow = template_timeGraphRow.content.querySelector('.time-graph__row');
    const timesRow = document.querySelector('.time-graph__row--times');

    for (let i = 0; i <= Math.ceil(this._jobScheduler.getMaxTime()); ++i) {
      rowTemplateRow.insertAdjacentHTML('beforeend', `<div class="time-graph__cell time-graph__cell--${i}"></div>`);
      timesRow.insertAdjacentHTML('beforeend', `<div class="time-graph__cell time-graph__cell--${i}"><span>${i}</span></div>`);
    }

    /****************************************************** */
    // GENERATE TIME GRAPH ROWS AND JOB BARS
    /****************************************************** */
    const jobBarsEl = document.querySelector('.time-graph__job-bars');

    jobsUnsorted.forEach((job, i) => {
      // job bar
      const jobEl = this._generateJobBar(job);
      jobEl.style.left = `${i*10}rem`;
      jobEl.style.top = `${i*10}rem`;
      jobBarsEl.append(jobEl);

      // time graph row
      const cloneRow = document.importNode(template_timeGraphRow.content, true);
      const timeGraphRow = cloneRow.querySelector('.time-graph__row');
      // row header data
      const rowSJNum = cloneRow.querySelector('.time-graph__SJ-num');
      const rowLetter_unsorted = cloneRow.querySelector('.time-graph__job-letter--unsorted');
      const rowLetter_sorted = cloneRow.querySelector('.time-graph__job-letter--sorted');

      const sortedJobLetter = this._jobScheduler.getJobs()[i].getJobLetter(); // letters but ordered with respect to sorted job numbers
      const unsortedJobLetter = String.fromCharCode(i + 65); // in order of A, B, C, D, etc.

      timeGraphRow.classList.add(`time-graph__row--${i}`);
      timeGraphRow.dataset.jobletterunsorted = unsortedJobLetter;
      rowLetter_unsorted.textContent = `Job ${unsortedJobLetter}`;
      timeGraphRow.dataset.joblettersorted = sortedJobLetter;
      rowLetter_sorted.textContent = `Job ${sortedJobLetter}`;
      rowSJNum.textContent = `j=${i+1}`;

      timesRow.before(timeGraphRow); // inserting new rows above the times row
    });
    document.getElementById('time-graph__job-bar-template').remove();
    template_timeGraphRow.remove();


    /****************************************************** */
    // INSERT ARRAY BLOCKS
    /****************************************************** */
    const template_arrayBlock = document.getElementById('array__array-block-template');
    const array_J1 = document.querySelector('.array-group--j-and-c .array--j');
    const array_J2 = document.querySelector('.array-group--j-and-M .array--j');
    const array_c = document.querySelector('.array-group--j-and-c .array--c');
    const array_M = document.querySelector('.array-group--j-and-M .array--M');

    const numJobs = this._jobScheduler.getNumJobs();

    for (let i = 0; i <= numJobs; ++i) {
      const jBlockString = `<div class="array__array-block array__array-block--${i} highlightable">${i}</div>`
      array_J1.insertAdjacentHTML('beforeend', jBlockString);
      array_J2.insertAdjacentHTML('beforeend', jBlockString);
      
      const cloneBlock_c = document.importNode(template_arrayBlock.content, true);
      const cloneBlock_M = document.importNode(template_arrayBlock.content, true);

      const arrayBlock_c = cloneBlock_c.querySelector('.array__array-block');
      arrayBlock_c.classList.add(`array__array-block--${i}`);
      arrayBlock_c.querySelector('.array__array-entry--value').textContent = this._jobScheduler.getC(i);
      array_c.append(arrayBlock_c);

      const arrayBlock_M = cloneBlock_M.querySelector('.array__array-block');
      arrayBlock_M.classList.add(`array__array-block--${i}`);
      arrayBlock_M.querySelector('.array__array-entry--value').textContent = this._jobScheduler.getM(i);
      array_M.append(arrayBlock_M);
    }

    template_arrayBlock.remove();


    /****************************************************** */
    // SET UP TEXT BOXES
    /****************************************************** */
    document.querySelectorAll('.fill--last-job-letter').forEach((el) => el.textContent = String.fromCharCode( (numJobs - 1) + 65 ));
    document.querySelectorAll('.fill--last-SJ-num').forEach((el) => el.textContent = numJobs);
    
    const template_cExplanationParagraphs = document.getElementById('fill-c-array-paragraphs-template');
    const textbox_fillCArray = document.querySelector('.text-box-line-group--fill-c-array .text-box');
    this._jobScheduler.getJobs().forEach(job => {
      const cloneParagraphGroup = document.importNode(template_cExplanationParagraphs.content, true);
      const currSJNum = job.getSortedJobNum();
      const currCEntry = job.getCompatibleJobNum();
      const currStartTime = job.getStart();

      const textP_fillCArray_forJobX = cloneParagraphGroup.querySelector('.text-box__paragraph--for-job-X');
      textP_fillCArray_forJobX.classList.replace('text-box__paragraph--for-job-X', `text-box__paragraph--for-job-${currSJNum}`);
      textP_fillCArray_forJobX.querySelectorAll('.fill--curr-SJ-num').forEach(toFill => toFill.textContent = `${currSJNum}`);
      textP_fillCArray_forJobX.querySelectorAll('.fill--curr-start-time').forEach(toFill => toFill.textContent = `${currStartTime}`);


      const textP_fillCArray_resultJobX = cloneParagraphGroup.querySelector('.text-box__paragraph--result-job-X');
      textP_fillCArray_resultJobX.classList.replace('text-box__paragraph--result-job-X', `text-box__paragraph--result-job-${currSJNum}`);
      const resultCompatibleText = textP_fillCArray_resultJobX.querySelector('.fill--result-compatible-job-text');
      if (currCEntry === 0) {
        resultCompatibleText.innerHTML =
        `
          <span class="SJ-related">job ${currSJNum}</span> does not have a <span class="c-related">compatible job</span> before it.
        `;
      }
      else {
        resultCompatibleText.innerHTML =
        `
          <span class="SJ-related">job ${currSJNum}</span>'s nearest <span class="c-related">compatible job</span> is
          <span class="c-related">job ${currCEntry}</span>, which ends at time ${this._jobScheduler.getJobs()[currCEntry - 1].getFinish()}.
        `;
      }
      textP_fillCArray_resultJobX.querySelectorAll('.fill--curr-SJ-num').forEach(toFill => toFill.textContent = `${currSJNum}`);
      textP_fillCArray_resultJobX.querySelectorAll('.fill--curr-c-entry').forEach(toFill => toFill.textContent = `${currCEntry}`);

      textbox_fillCArray.append(textP_fillCArray_forJobX);
      textbox_fillCArray.append(textP_fillCArray_resultJobX);
    });

    template_cExplanationParagraphs.remove();
  }

  _generateJobBar(job) {
    const template_jobBar = document.getElementById("time-graph__job-bar-template");
    const cloneBar = document.importNode(template_jobBar.content, true);
    const jobBarEl = cloneBar.querySelector('.time-graph__job-bar');

    jobBarEl.textContent = `weight ${job.getWeight()}`;
    jobBarEl.dataset.jobletter = job.getJobLetter();
    jobBarEl.dataset.sjnum = `${job.getSortedJobNum()}`;
    jobBarEl.dataset.compatiblejobnum = `${job.getCompatibleJobNum()}`;
    jobBarEl.dataset.start = job.getStart();
    jobBarEl.title = `Job ${job.getJobLetter()}:
      start = ${job.getStart()}
      finish = ${job.getFinish()}
      weight = ${job.getWeight()}
      -------------------
      -------------------
      j = ${job.getSortedJobNum()}
      c[ j ] = ${job.getCompatibleJobNum()}`;
    jobBarEl.style.width = `calc(${18 * job.getDuration()}rem + 1px)`;

    job.setJobBar(jobBarEl);

    return jobBarEl;
  }
  
  _generateCardTree() {
    const jobTreeRootNode = this._jobScheduler.getRootNode();
    const newCardEl = this._genNewJobCard(jobTreeRootNode.data);

    const rootContainerEl = document.querySelector('.job-cards');
    rootContainerEl.append(newCardEl);

    const childrenContainerEl = newCardEl.querySelector('.job-card-children');
    jobTreeRootNode.children.forEach((childNode) => { this._generateCardTreeR(childNode, childrenContainerEl); });
    
    document.getElementById('job-card-template').remove();
    document.getElementById('job-stub-template').remove();

    this._cardTreeGenerated = true;
  }

  _generateCardTreeR(treeNode, parentContainerEl) {
    if (!treeNode.isLeaf) {
      const newCardEl = this._genNewJobCard(treeNode.data);
      parentContainerEl.append(newCardEl);

      const childrenContainerEl = newCardEl.querySelector('.job-card-children');
      treeNode.children.forEach((childNode) => { this._generateCardTreeR(childNode, childrenContainerEl); });
    }
    else {
      const newStubEl = this._genNewJobStub(treeNode.data);
      parentContainerEl.append(newStubEl);
    }
  }

  _genNewJobCard(data) {
    const template_jobCard = document.getElementById("job-card-template");
    const cloneCard = document.importNode(template_jobCard.content, true);
    const jobCardEl = cloneCard.querySelector('.job-card');

    this._setJobCardData(jobCardEl, data);

    return jobCardEl;
  }

  _genNewJobStub(data) {
    const template_jobStub = document.getElementById("job-stub-template");
    const cloneStub = document.importNode(template_jobStub.content, true);
    const jobStubEl = cloneStub.querySelector('.job-card--stub');

    this._setJobStubData(jobStubEl, data);
  
    return jobStubEl;
  }
  
  _setJobCardData(jobCardEl, data) {
    const {
      job,
      computationResult1,
      computationResult2,
      MEntry: formulaResult,
    } = data;

    const SJNum = job.getSortedJobNum();
    const weight = job.getWeight();
    const cEntry = job.getCompatibleJobNum();
    const nextSJNum = SJNum - 1;

    const OPTResult1 = computationResult1 - weight;
    const OPTResult2 = computationResult2 - weight;
  
    const cardNum = this._nextCardNum++;
  
    const jobCardContentEl = jobCardEl.querySelector('.job-card-content');
  
    const weightEl = jobCardContentEl.querySelector('.weight');
    const cEntryEl = jobCardContentEl.querySelector('.c-entry');
  
    const nextSJNumEl = jobCardContentEl.querySelector('.next-SJ-num');
  
    jobCardContentEl.dataset.cardnum = `${cardNum}`;
    jobCardEl.dataset.sjnum = `${SJNum}`;
    weightEl.textContent = weight;
    cEntryEl.textContent = cEntry;
    nextSJNumEl.textContent = nextSJNum;
  
  
    const OPTResult1El = jobCardContentEl.querySelector('.computation--1 .OPT-result');
    const computationResult1El = jobCardContentEl.querySelector('.computation--1 .computation-result');
  
    OPTResult1El.textContent = OPTResult1;
    computationResult1El.textContent = computationResult1;
  
  
    const OPTResult2El = jobCardContentEl.querySelector('.computation--2 .OPT-result');
    const computationResult2El = jobCardContentEl.querySelector('.computation--2 .computation-result');
  
    OPTResult2El.textContent = OPTResult2;
    computationResult2El.textContent = computationResult2;
  
  
    const formulaResultEl = jobCardContentEl.querySelector('.formula-result');
    const MEntryEl = jobCardContentEl.querySelector('.M-entry');
    formulaResultEl.textContent = formulaResult;
    MEntryEl.textContent = formulaResult;
  
  
    // Set finishing text depending on whether or not this is the root card or a child card
    const textP_MAccess = jobCardContentEl.querySelector('.text-box-line-group--M-access .text-box__paragraph--solved');
    if (cardNum === 1) {
      textP_MAccess.innerHTML =
      `
        Excellent, this is the last finishing job, so we are finished.
        The optimal weight we can achieve from our time graph is <span class="fill--comp-final">X</span>.
      `;
    }
    else {
      textP_MAccess.innerHTML =
      `
        Excellent. Now let's pass this result back up the tree.
      `;
    }
  
    
    jobCardContentEl.querySelectorAll('.SJ-num').forEach((el) => el.textContent = SJNum);
    jobCardContentEl.querySelectorAll('.fill--next-SJ-num').forEach((el) => el.textContent = nextSJNum);
    jobCardContentEl.querySelectorAll('.fill--c-entry').forEach((el) => el.textContent = cEntry);
    jobCardContentEl.querySelectorAll('.fill--weight').forEach((el) => el.textContent = weight);
    jobCardContentEl.querySelectorAll('.fill--OPT-1').forEach((el) => el.textContent = OPTResult1);
    jobCardContentEl.querySelectorAll('.fill--OPT-2').forEach((el) => el.textContent = OPTResult2);
    jobCardContentEl.querySelectorAll('.fill--comp-1').forEach((el) => el.textContent = computationResult1);
    jobCardContentEl.querySelectorAll('.fill--comp-2').forEach((el) => el.textContent = computationResult2);
    jobCardContentEl.querySelectorAll('.fill--comp-final').forEach((el) => el.textContent = formulaResult);
  }

  _setJobStubData(jobStubEl, data) {
    const {job, MEntry} = data;

    const cardNum = this._nextCardNum++;
    const SJNum = job?.getSortedJobNum() ?? 0;

    const SJNumEls = jobStubEl.querySelectorAll('.SJ-num');
    const MEntryEl = jobStubEl.querySelector('.M-entry');
    const textParagraph2 = jobStubEl.querySelector('.text-box-line-group--M-access .text-box__paragraph--2');
  
    if (SJNum > 0) {
      textParagraph2.innerHTML =
      `
        The entry already exists, so we already know that the optimal weight from
        the beginning through <span class="SJ-related">job ${SJNum}</span> is ${MEntry}.
        Let's pass this back up the tree.
      `;
    }
    else {
      textParagraph2.innerHTML =
      `
        The entry already exists. Of course, there is no "<span class="SJ-related">job 0</span>";
        this is the base case for <span class="SJ-related">j = 0</span>. 0 jobs means 0 weight.
        Let's pass this back up the tree.
      `;
    }
  
    jobStubEl.dataset.cardnum = `${cardNum}`;
    jobStubEl.dataset.sjnum = `${SJNum}`;
    SJNumEls.forEach((el) => { el.textContent = SJNum; });
    MEntryEl.textContent = MEntry;
  }
};