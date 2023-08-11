import { setupPlaybackControls } from './playbackControls.js';
import { JobScheduler } from './JobScheduler.js';
import { SceneCreator } from './SceneCreator.js';
import { AnimSequence } from './AnimSequence.js';
import { AnimTimeline } from "./AnimTimeline.js";
import { WebFlik } from './TestUsability/WebFlik.js';
import { Connector } from './AnimBlockLine.js';
import { Job } from './Job.js';

// \[\s'std',\s(.*'~)(high|un-high)(.*')(.*)\s\]
// (\s*)(\[ 'line)


// TODO: Put somewhere better
const dataDisplay = document.querySelector('.data-display') as HTMLElement;
const animTimeline = new AnimTimeline({debugMode: true});

const {
  Entrance,
  Exit,
  Emphasis,
  Translation,
  SetConnector,
  DrawConnector,
  EraseConnector,
} = WebFlik.createBanks({});

export function generateVisualization (jobsUnsorted: Job[]) {
  // fade-in visualization screen
  (function() {
    const fadeinVisualization = Entrance(document.querySelector('.visualization'), '~fade-in', [], {duration: 375});
    fadeinVisualization.stepForward();
  })();

  // const jobsUnsorted = [
  //   new Job(5, 9, 7),
  //   new Job(8, 11, 5),
  //   new Job(0, 6, 2),
  //   new Job(1, 4, 1),
  //   new Job(3, 8, 5),
  //   new Job(4, 7, 4),
  //   new Job(6, 10, 3),
  //   new Job(3, 5, 6),
  // ];

  const jobScheduler = new JobScheduler();

  jobsUnsorted.forEach(job => jobScheduler.addJob(job));
  jobScheduler.performWISAlgorithm();

  const sceneCreator = new SceneCreator(jobScheduler);
  sceneCreator.generateScene();

  setUpDataDisplayScroll(dataDisplay);
  animateDataDisplay(dataDisplay, jobScheduler);
  animateJobCard(document.querySelector('.job-card') as HTMLElement); // naturally starts at the root job card
  setupPlaybackControls(animTimeline);
};

// allows the data display (left view with the time graph and arrays) to scroll horizontally
function setUpDataDisplayScroll (dataDisplay: HTMLElement) {
  document.addEventListener('scroll', function() {
    dataDisplay.style.left = `${-window.scrollX}px`;
  });
};

// creates animation sequences for the data display
function animateDataDisplay(dataDisplay: HTMLElement, jobScheduler: JobScheduler) {
  const timeGraphEl = document.querySelector('.time-graph') as HTMLElement;
  const jobsUnsorted = jobScheduler.getJobsUnsorted();
  const jobsSorted = jobScheduler.getJobs();


  const textbox_placeBars = dataDisplay.querySelector('.text-box-line-group--place-bars .text-box') as HTMLElement;
  const connector_placeBars = dataDisplay.querySelector('.text-box-line-group--place-bars wbfk-connector') as Connector;
  const paragraph_placeBars_unorder = textbox_placeBars.querySelector('.text-box__paragraph--unorder');
  const paragraph_placeBars_unorder2 = textbox_placeBars.querySelector('.text-box__paragraph--unorder-2');
  const paragraph_placeBars_order = textbox_placeBars.querySelector('.text-box__paragraph--order');
  const paragraph_placeBars_ordered = textbox_placeBars.querySelector('.text-box__paragraph--ordered');

  /****************************************************** */
  // DESCRIBE THAT WE'RE ABOUT TO MOVE BARS ONTO GRAPH
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: `Describe that we're about to move bars onto graph`,
    })
    .addBlocks(
      SetConnector(connector_placeBars, [textbox_placeBars, 0.5, 1], [jobsUnsorted[0].getJobBar(), 0.5, 0]),
      DrawConnector(connector_placeBars, '~trace', ['from-B']),
      Entrance(textbox_placeBars, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }

  /****************************************************** */
  // MOVE JOB BARS ONTO TIME GRAPH IN UNSORTED ORDER
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Move job bars onto time graph in unsorted order',
    })
    .addBlocks(
      EraseConnector(connector_placeBars, '~trace', ['from-B'], {startsNextBlock: true}),
    );
    jobsUnsorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      // set up options for moving job bars to correct location
      const jobLetter = jobBarEl.dataset.jobletter;
      const startCell = document.querySelector(`.time-graph__row[data-jobletterunsorted="${jobLetter}"] .time-graph__cell--${jobBarEl.dataset.start}`) as HTMLElement;
      animSequence.addBlocks(Translation(jobBarEl, '~move-to', [startCell]));
    });
    animSequence.addBlocks(
      Exit(paragraph_placeBars_unorder, '~fade-out', [], {duration: 250}),
      Entrance(paragraph_placeBars_unorder2, '~fade-in', [], {duration: 250}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // MOVE JOB BARS BACK OFF OF THE TIME GRAPH
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Move job bars back off of the time graph',
    })
    .addBlocks(
      Exit(paragraph_placeBars_unorder2, '~fade-out', [], {duration: 250}),
      Entrance(paragraph_placeBars_order, '~fade-in', [], {duration: 250}),
    );
    const jobBarsInitialArea = document.querySelector('.time-graph__job-bars') as HTMLElement;
    jobsUnsorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      animSequence.addBlocks(Translation(jobBarEl, '~move-to', [jobBarsInitialArea], {startsNextBlock: true}));
    });

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // MOVE JOB BARS BACK ONTO THE TIME GRAPH (SORTED BY FINISH TIME) AND UPDATE TIME GRAPH ROW HEADERS
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars back onto the time graph (sorted by finish time) and update time graph row headers');
    jobsSorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      // set up options for moving job bars to correct location
      const jobLetter = jobBarEl.dataset.jobletter;
      const row = document.querySelector(`.time-graph__row[data-joblettersorted="${jobLetter}"]`) as HTMLElement;
      const startCell = row.querySelector(`.time-graph__cell--${jobBarEl.dataset.start}`);
      
      // get row's header data to animate
      const rowSJNum = row.querySelector('.time-graph__SJ-num');
      const rowUnsortedLetter = row.querySelector('.time-graph__job-letter--unsorted');
      const rowSortedLetter = row.querySelector('.time-graph__job-letter--sorted');
      
      animSequence.addBlocks(
        Translation(jobBarEl, '~move-to', [startCell]),
        Exit(rowUnsortedLetter, '~wipe', ['from-right'], {duration: 250, startsWithPreviousBlock: true}),
        Entrance(rowSJNum, '~wipe', ['from-right'], {duration: 250, startsWithPreviousBlock: true, delay: 250}),
        Entrance(rowSortedLetter, '~wipe', ['from-right'], {duration: 250, startsWithPreviousBlock: true}),
      );
    });

    animSequence.addBlocks(
      Exit(paragraph_placeBars_order, '~fade-out', [], {duration: 250}),
      Entrance(paragraph_placeBars_ordered, '~fade-in', [], {duration: 250}),
    );

    animTimeline.addSequences(animSequence);
  }


  const arrayGroup_j_c = dataDisplay.querySelector('.array-group--j-and-c') as HTMLElement;
  const cArray = arrayGroup_j_c.querySelector('.array--c') as HTMLElement;
  const jArray1 = arrayGroup_j_c.querySelector('.array--j');
  const textbox_cArray = dataDisplay.querySelector('.text-box-line-group--c-array .text-box') as HTMLElement;
  const connector_cArray = dataDisplay.querySelector('.text-box-line-group--c-array wbfk-connector') as Connector;
  const paragraph_cArray_explain = textbox_cArray.querySelector('.text-box__paragraph--explain');
  const paragraph_cArray_refArray = textbox_cArray.querySelector('.text-box__paragraph--ref-array');
  /****************************************************** */
  // EXPLAIN WHAT A COMPATIBLE JOB IS
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain what a compatible job is',
    })
    .addBlocks(
      Exit(textbox_placeBars, '~fade-out', []),
      Entrance(jArray1, '~wipe', ['from-left']),
      Entrance(cArray, '~wipe', ['from-left']),
      Entrance(textbox_cArray, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // EXPLAIN WHAT C ARRAY WILL BE USED FOR
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain what c array will be used for',
    })
    .addBlocks(
      SetConnector(connector_cArray, [textbox_cArray, 0, 0.5], [cArray, 1, 0.5]),
      DrawConnector(connector_cArray, '~trace', ['from-B']),
      Exit(paragraph_cArray_explain, '~fade-out', [], {duration: 250}),
      Entrance(paragraph_cArray_refArray, '~fade-in', [], {duration: 250}),
    );
    
    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // HIDE EXPLANATION OF C ARRAY'S PURPOSE AND CONTINUE INTO NEXT PHASE
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: `Hide explanation of c array's purpose and continue into next phase`,
      continueNext: true, // after hiding, immediately continue into next phase
    })
    .addBlocks(
      Exit(textbox_cArray, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_cArray, '~trace', ['from-A']),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // DEMONSTRATE HOW TO FILL OUT THE C ARRAY
  /****************************************************** */
  const textbox_fillCArray = dataDisplay.querySelector('.text-box-line-group--fill-c-array .text-box') as HTMLElement;
  const cBar = document.querySelector('.time-graph__c-bar'); // vertical bar
  const timeGraphArrowEl = timeGraphEl.querySelector('wbfk-connector') as Connector; // arrow connecting c entry and compatible job's row header
  jobsSorted.forEach((job) => {
    const jobBarEl = job.getJobBar();
    // get j array block corresponding to current job bar
    const jBlock = document.querySelector(`.array-group--j-and-c .array--j .array__array-block--${jobBarEl.dataset.sjnum}`);
    // Find job bar corresponding to the job that's compatible with the current job (if it exists)
    const compatibleJobBarEl = document.querySelector(`.time-graph__job-bar[data-sjnum="${jobBarEl.dataset.compatiblejobnum}"]`) as HTMLElement;
    // get the c array entry corresponding to the current job
    const cBlock = cArray.querySelector(`.array__array-block--${jobBarEl.dataset.sjnum}`) as HTMLElement;
    const cEntryValue = cBlock.querySelector(`.array__array-entry--value`);
    const cEntryBlank = cBlock.querySelector(`.array__array-entry--blank`);
    let row;
    let rowSJNum;

    const paragraph_fillCArray_forJobX = textbox_fillCArray.querySelector(`.text-box__paragraph--for-job-${jobBarEl.dataset.sjnum}`);
    const paragraph_fillCArray_resultJobX = textbox_fillCArray.querySelector(`.text-box__paragraph--result-job-${jobBarEl.dataset.sjnum}`);
    const paragraph_fillCArray_continueOn = textbox_fillCArray.querySelector(`.text-box__paragraph--continue-on`);

    // MOVE CBAR TO CURRENT JOB BAR, UNHIDE IT, AND HIGHLIGHT CURRENT JOB BAR AND J ARRAY BLOCK
    {
      const animSequence = new AnimSequence({
        description: 'Move cbar to current job bar, unhide it, and highlight current job bar and j array block',
        continuePrev: true,
      })
      .addBlocks(
        Translation(cBar, '~move-to', [jobBarEl, {preserveY: true}], {duration: 0}),
        Emphasis(jobBarEl, '~highlight', [], {startsNextBlock: true}),
        Emphasis(jBlock, '~highlight', [], {startsNextBlock: true}),
        Entrance(cBar, '~wipe', ['from-top']),
        Entrance(paragraph_fillCArray_forJobX, '~appear', [], {startsNextBlock: true}), // TODO: No need for blocksNext now
        Entrance(textbox_fillCArray, '~fade-in', []),
      );

      animTimeline.addSequences(animSequence);
    }


    // MOVE CBAR, HIGHLIGHT COMPATIBLE JOB IF EXISTS, AND POINT TO C ARRAY
    {
      const animSequence = new AnimSequence({description: 'Move cbar and highlight compatible job if it exists'});
      const animSequence2 = new AnimSequence({description:'Point to c array and fill entry'});
      // If the compatible job exists, Move cbar to compatible job bar and highlight it
      // Then point arrow from compatible row header to current c-array entry
      if (compatibleJobBarEl) {
        row = document.querySelector(`.time-graph__row[data-joblettersorted="${compatibleJobBarEl.dataset.jobletter}"]`) as HTMLElement;
        rowSJNum = row.querySelector('.time-graph__SJ-num');
        animSequence.addBlocks(
          Translation(cBar, '~move-to', [compatibleJobBarEl, {alignmentX: 'right', preserveY: true}]),
          Emphasis(compatibleJobBarEl, '~highlight', []),
        );
        animSequence2.addBlocks(
          SetConnector(timeGraphArrowEl, [rowSJNum, 1, 0.5], [cBlock, 0.5, 0]),
          // TODO: No reason for blocksPrev to be false
          DrawConnector(timeGraphArrowEl, '~trace', ['from-top']),
        );
      }
      // If no compatible job exists, move cbar to left of time graph
      // Then point arrow from bottom of cbar to current c-array entry
      else {
        animSequence.addBlocks(
          Translation(cBar, '~move-to', [timeGraphEl, {alignmentX: 'left', preserveY: true}]),
        );
        animSequence2.addBlocks(
          SetConnector(timeGraphArrowEl, [cBar, 0, 1], [cBlock, 0.5, 0]),
          DrawConnector(timeGraphArrowEl, '~trace', ['from-top']),
        );
      }

      animSequence.addBlocks(
        Exit(paragraph_fillCArray_forJobX, '~fade-out', [], {duration: 250}),
        Entrance(paragraph_fillCArray_resultJobX, '~fade-in', [], {duration: 250}),
      );
    
      // "Update" current c-array entry
      animSequence2.addBlocks(
        Exit(cEntryBlank, '~wipe', ['from-right'], {startsNextBlock: true}),
        Entrance(cEntryValue, '~wipe', ['from-right']),
        Exit(paragraph_fillCArray_resultJobX, '~fade-out', [], {duration: 250}),
        Entrance(paragraph_fillCArray_continueOn, '~fade-in', [], {duration: 250}),
      );
    
      animTimeline.addSequences(animSequence, animSequence2);
    }


    // HIDE CBAR AND ARROW AND UN-HIGHLIGHT EVERYTHING
    {
      const animSequence = new AnimSequence({
        description: 'Hide cbar and arrow and un-highlight everything',
        continueNext: true,
      });
      if (compatibleJobBarEl) {
        animSequence.addBlocks(
          Emphasis(compatibleJobBarEl, '~un-highlight', [], {startsNextBlock: true}),
        );
      }
      animSequence.addBlocks(
        EraseConnector(timeGraphArrowEl, '~trace', ['from-bottom'], {startsNextBlock: true}),
      );
      animSequence.addBlocks(
        Exit(textbox_fillCArray, '~fade-out', [], {startsNextBlock: true}),
        // [ 'std', paragraph_fillCArray_continueOn, '~fade-out', [], {duration: 0}], // TODO: This being here and having to add startNextBlock: true above needs to be considered
        Exit(cBar, '~fade-out', [], {startsNextBlock: true}),
        Emphasis(jobBarEl, '~un-highlight', [], {startsNextBlock: true}),
        Emphasis(jBlock, '~un-highlight', []),
        Exit(paragraph_fillCArray_continueOn, '~disappear', []),
      );

      animTimeline.addSequences(animSequence);
    }
  });


  const textbox_finishedCArray = dataDisplay.querySelector('.text-box-line-group--finished-c-array .text-box');
  const connector_showNaive = dataDisplay.querySelector('.text-box-line-group--show-naive wbfk-connector') as Connector;
  const textbox_showNaive = dataDisplay.querySelector('.text-box-line-group--show-naive .text-box') as HTMLElement;
  const algorithm_term1 = textbox_showNaive.querySelector('.algorithm__term-1');
  const algorithm_term2 = textbox_showNaive.querySelector('.algorithm__term-2');
  /****************************************************** */
  // STATE THAT NOW WE NEED TO FIND THE MAXIMUM WEIGHT
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'State that now we need to find the maximum weight',
      tag: 'finished c array',
      continuePrev: true,
    })
    .addBlocks(
      Entrance(textbox_finishedCArray, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // SHOW NAIVE APPROACH TO FINDING MAX WEIGHT
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain naive approach to finding max weight',
      tag: 'show naive',
    })
    .addBlocks(
      Translation(textbox_showNaive, '~move-to', [textbox_finishedCArray, {offsetTargetY: 1, offsetSelfY: '10rem'}], {duration: 0}),
      SetConnector(connector_showNaive, [textbox_finishedCArray, 0.5, 1], [textbox_showNaive, 0.5, 0]),
      DrawConnector(connector_showNaive, '~trace', ['from-top']),
      Entrance(textbox_showNaive, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }

  const textbox_explainNaive1 = dataDisplay.querySelector('.text-box-line-group--explain-naive-1 .text-box');
  const connector_explainNaive1 = dataDisplay.querySelector('.text-box-line-group--explain-naive-1 wbfk-connector') as Connector;
  /****************************************************** */
  // EXPLAIN POSSIBILITY THAT JOB IS PART OF OPTIMAL SEQUENCE
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain possibility that job is part of optimal sequence',
      tag: 'explain naive',
    })
    .addBlocks(
      Translation(textbox_explainNaive1, '~move-to', [textbox_showNaive, {offsetTargetY: 1, offsetSelfY: '10rem', offsetTargetX: -1.0, offsetSelfX: '10rem'}], {duration: 0}),
      Emphasis(algorithm_term1, '~highlight', []),
      SetConnector(connector_explainNaive1, [algorithm_term1, 0.5, 1], [textbox_explainNaive1, 0.5, 0]),
      DrawConnector(connector_explainNaive1, '~trace', ['from-top']),
      Entrance(textbox_explainNaive1, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }

  const textbox_explainNaive2 = dataDisplay.querySelector('.text-box-line-group--explain-naive-2 .text-box');
  const connector_explainNaive2 = dataDisplay.querySelector('.text-box-line-group--explain-naive-2 wbfk-connector') as Connector;
  /****************************************************** */
  // EXPLAIN POSSIBILITY THAT JOB IS **NOT** PART OF OPTIMAL SEQUENCE
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain possibility that job is NOT part of optimal sequence',
      tag: 'explain naive' // TODO: Why is this identical to the one above?
    })
    .addBlocks(
      Translation(textbox_explainNaive2, '~move-to', [textbox_showNaive, {offsetTargetY: 1, offsetSelfY: '10rem', offsetTargetX: 1.0, offsetSelfX: '-10rem', alignmentX: 'right'}], {duration: 0}),
      Emphasis(algorithm_term2, '~highlight', []),
      SetConnector(connector_explainNaive2, [algorithm_term2, 0.5, 1], [textbox_explainNaive2, 0.5, 0]),
      DrawConnector(connector_explainNaive2, '~trace', ['from-top']),
      Entrance(textbox_explainNaive2, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }

  /****************************************************** */
  // HIDE NAIVE APPROACH EXPLANATIONS
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Hide naive approach explanations',
      tag: 'explain naive bad',
      continueNext: true,
    })
    .addBlocks(
      Exit(textbox_explainNaive1, '~fade-out', [], {startsNextBlock: true}),
      Exit(textbox_explainNaive2, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_explainNaive1, '~trace', ['from-bottom'], {startsNextBlock: true}),
      EraseConnector(connector_explainNaive2, '~trace', ['from-bottom'], {startsNextBlock: true}),
      Emphasis(algorithm_term1, '~un-highlight', [], {startsNextBlock: true}),
      Emphasis(algorithm_term2, '~un-highlight', []),
    );

    animTimeline.addSequences(animSequence);
  }


  const textbox_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad .text-box');
  const connector_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad wbfk-connector') as Connector;
  /****************************************************** */
  // EXPLAIN WHY NAIVE APPROACH IS BAD
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain why naive approach is bad',
      continuePrev: true,
    })
    .addBlocks(
      Translation(textbox_explainNaiveBad, '~move-to', [textbox_showNaive, {offsetTargetY: 1, offsetSelfY: '10rem'}], {duration: 0}),
      SetConnector(connector_explainNaiveBad, [textbox_showNaive, 0.5, 1], [textbox_explainNaiveBad, 0.5, 0]),
      DrawConnector(connector_explainNaiveBad, '~trace', ['from-top']),
      Entrance(textbox_explainNaiveBad, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  const naiveAlgorithmText = dataDisplay.querySelector('.naive-algorithm-text');
  /****************************************************** */
  // COLLAPSE TEXT BOXES ABOUT THE NAIVE APPROACH
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Collapse text boxes about the naive approach',
      continueNext: true,
    })
    .addBlocks(
      Exit(naiveAlgorithmText, '~fade-out', []),
    );

    animTimeline.addSequences(animSequence);
  }

  const arrayGroup_j_M = dataDisplay.querySelector('.array-group--j-and-M') as HTMLElement;
  const MArray = arrayGroup_j_M.querySelector('.array--M') as HTMLElement;
  const jArray2 = arrayGroup_j_M.querySelector('.array--j');
  const textbox_MArray = dataDisplay.querySelector('.text-box-line-group--M-array .text-box') as HTMLElement;
  const connector_MArray = dataDisplay.querySelector('.text-box-line-group--M-array wbfk-connector') as Connector;
  const paragraph_MArray_explain = textbox_MArray.querySelector('.text-box__paragraph--explain');
  const paragraph_MArray_refArray = textbox_MArray.querySelector('.text-box__paragraph--ref-array');
  /****************************************************** */
  // EXPLAIN MEMOIZATION
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain memoization',
      tag: 'introduce memoization',
      continuePrev: true,
    })
    .addBlocks(
      Entrance(jArray2, '~wipe', ['from-left']),
      Entrance(MArray, '~wipe', ['from-left']),
      Entrance(textbox_MArray, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }

  const arrayBlock_M_0 = MArray.querySelector('.array__array-block--0') as HTMLElement;
  const arrayBlank_M_0 = arrayBlock_M_0.querySelector('.array__array-entry--blank');
  const arrayValue_M_0 = arrayBlock_M_0.querySelector('.array__array-entry--value');
  /****************************************************** */
  // EXPLAIN WHAT M ARRAY WILL BE USED FOR
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Explain what M array will be used for',
    })
    .addBlocks(
      SetConnector(connector_MArray, [textbox_MArray, 0, 0.5], [MArray, 1, 0.5]),
      DrawConnector(connector_MArray, '~trace', ['from-B']),
      Exit( paragraph_MArray_explain, '~fade-out', [], {duration: 250}),
      Entrance( paragraph_MArray_refArray, '~fade-in', [], {duration: 250}),
      Exit(arrayBlank_M_0, '~fade-out', []),
      Entrance(arrayValue_M_0, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  const textbox_showMemoized = dataDisplay.querySelector('.text-box-line-group--show-memoized .text-box');
  const connector_showMemoized = dataDisplay.querySelector('.text-box-line-group--show-memoized wbfk-connector') as Connector;
  /****************************************************** */
  // SHOW MEMOIZED ALGORITHM
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Show memoized algorithm',
    })
    .addBlocks(
      Translation(textbox_showMemoized, '~move-to', [textbox_MArray, {offsetTargetX: 1, offsetSelfX: '6.25rem', preserveY: true}], {duration: 0}),
      SetConnector(connector_showMemoized, [textbox_MArray, 1, 0.5], [textbox_showMemoized, 0, 0.5]),
      DrawConnector(connector_showMemoized, '~trace', ['from-A']),
      Entrance( textbox_showMemoized, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  const MArrayTextBoxes = MArray.querySelector('.text-boxes');
  const dataDisplayBorder = dataDisplay.querySelector('.data-display__right-border');
  /****************************************************** */
  // HIDE M ARRAY TEXT EXPLANATION BOXES
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Hide M array text explanation boxes',
      continueNext: true,
    })
    .addBlocks(
      Exit(MArrayTextBoxes, '~fade-out', []),
      Entrance(dataDisplayBorder, '~wipe', ['from-top']),
    );

    animTimeline.addSequences(animSequence);
  }
};

// recursively creates animation sequences for the job card tree
function animateJobCard(jobCard: HTMLElement, parentArrowDown: Connector, parentArrowSource: Element, aboveBullet: Element): any;
function animateJobCard(jobCard: HTMLElement): any;
function animateJobCard(jobCard: HTMLElement, parentArrowDown?: Connector, parentArrowSource?: Element, aboveBullet?: Element) {
  if (!jobCard) { throw new Error('jobCard in animateJobCard() must not be null'); }
  // TODO: Add error-checking?
  const SJNum = Number.parseInt(jobCard.dataset.sjnum ?? '');
  const jobCardContent = jobCard.querySelector('.job-card-content') as HTMLElement;
  const SJNumLabel = jobCardContent.querySelector('.job-card-SJ-num-label');
  const MAccessContainer = jobCard.querySelector('.M-access-container');
  const MAccess = jobCard.querySelector('.M-access');
  const MEntry = jobCard.querySelector('.M-entry');
  const connector_MAccess = jobCard.querySelector('.text-box-line-group--M-access wbfk-connector') as Connector;
  const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box') as HTMLElement;
  const paragraph_MAccess_intro = textbox_MAccess.querySelector('.text-box__paragraph--intro');
  const paragraph_MAccess_solved = textbox_MAccess.querySelector('.text-box__paragraph--solved');

  const connector_toMBlock = jobCard.querySelector('.connector--M-access-to-M-block') as Connector;


  const arrowContainer = jobCard.querySelector('.arrow-container');
  const formulaContainer = jobCard.querySelector('.formula-container');
  const formulaComputation = jobCard.querySelector('.formula-computation');
  const formulaResult = jobCard.querySelector('.formula-result');
  const connector_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation wbfk-connector') as Connector;
  const textbox_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .text-box') as HTMLElement;
  const paragraph_formulaComputation_find = textbox_formulaComputation.querySelector('.text-box__paragraph--find');
  const paragraph_formulaComputation_max = textbox_formulaComputation.querySelector('.text-box__paragraph--max');
  const paragraph_formulaComputation_found = textbox_formulaComputation.querySelector('.text-box__paragraph--found');


  const computation1 = jobCard.querySelector('.computation--1') as HTMLElement;
  const computationResult1 = computation1.querySelector('.computation-result');
  const connector_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 wbfk-connector') as Connector;
  const textbox_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 .text-box') as HTMLElement;
  const computationExpression1 = jobCard.querySelector('.computation--1 .computation-expression');
  const paragraph_computation1_intro = textbox_computation1.querySelector('.text-box__paragraph--intro');
  const paragraph_computation1_summary = textbox_computation1.querySelector('.text-box__paragraph--summary');
  const cAccessContainer = jobCard.querySelector('.c-access-container');
  const cAccess = jobCard.querySelector('.c-access');
  const cEntry = jobCard.querySelector('.c-entry');
  const connector_cAccess = jobCard.querySelector('.text-box-line-group--c-access wbfk-connector') as Connector;
  const textbox_cAccess = jobCard.querySelector('.text-box-line-group--c-access .text-box') as HTMLElement;
  const paragraph_cAccess_find = textbox_cAccess.querySelector('.text-box__paragraph--find');
  const paragraph_cAccess_found = textbox_cAccess.querySelector('.text-box__paragraph--found');
  const connector_toCBlock = jobCard.querySelector('.connector--c-access-to-c-block') as Connector;
  const OPTExpressionContainer1 = jobCard.querySelector('.computation-expression--1 .OPT-expression-container') as HTMLElement;
  const OPTExpression1 = OPTExpressionContainer1.querySelector('.OPT-expression');
  const OPTResult1 = OPTExpressionContainer1.querySelector('.OPT-result');
  const connector_OPTExpression1 = jobCard.querySelector('.text-box-line-group--OPT-expression-1 wbfk-connector') as Connector;
  const textbox_OPTExpression1 = jobCard.querySelector('.text-box-line-group--OPT-expression-1 .text-box') as HTMLElement;
  const paragraph_OPTExpression1_find = textbox_OPTExpression1.querySelector('.text-box__paragraph--find');
  const paragraph_OPTExpression1_found = textbox_OPTExpression1.querySelector('.text-box__paragraph--found');


  const computation2 = jobCard.querySelector('.computation--2') as HTMLElement;
  const computationResult2 = computation2.querySelector('.computation-result');
  const OPTExpression2 = computation2.querySelector('.OPT-expression') as HTMLElement;
  const connector_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 wbfk-connector') as Connector;
  const textbox_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 .text-box') as HTMLElement;
  const paragraph_computation2_intro = textbox_computation2.querySelector('.text-box__paragraph--intro');
  const paragraph_computation2_summary = textbox_computation2.querySelector('.text-box__paragraph--summary');
  const connector_OPTExpression2 = jobCard.querySelector('.text-box-line-group--OPT-expression-2 wbfk-connector') as Connector;
  const textbox_OPTExpression2 = jobCard.querySelector('.text-box-line-group--OPT-expression-2 .text-box');
  const nextSJNumExpression = computation2.querySelector('.next-SJ-num-expression');
  const nextSJNum = computation2.querySelector('.next-SJ-num');


  const jobCardChild1 = [...(jobCard.querySelector('.job-card-children') as HTMLElement).children][0] as HTMLElement;
  const jobCardChild2 = [...(jobCard.querySelector('.job-card-children') as HTMLElement).children][1] as HTMLElement;


  const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`) as HTMLElement;
  const MBlock_blank = MBlock.querySelector(`.array__array-entry--blank`);
  const MBlock_value = MBlock.querySelector(`.array__array-entry--value`);
  const cBlock = document.querySelector(`.array--c .array__array-block--${SJNum}`);


  const connector_upTree = jobCard.querySelector('.connector--up-tree') as Connector;
  const connector_downTree = jobCard.querySelector('.connector--down-tree') as Connector;
  const jobCardBullet = jobCard.querySelector('.job-card-bullet') as HTMLElement;


  /****************************************************** */
  // FADE IN JOB CARD AND M ACCESS
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Fade in job card and M access',
      tag: 'start',
      continuePrev: true,
    });
    if (parentArrowDown && parentArrowSource && aboveBullet) {
      const connector_bulletConnector = jobCard.querySelector('.connector--bullet-connector') as Connector;
      animSequence.addBlocks(
        // TODO: need to address the fact that jobCard needs to be revealed first or SJNumLabel's position won't be available below
        Entrance(jobCard, '~fade-in', [], {startsNextBlock: true}), // TODO: blocksPrev being false wouldn't make the data-display border disappear in parallel
        SetConnector(parentArrowDown, [parentArrowSource, 0, 1], [SJNumLabel, 0.5, -0.2]),
        DrawConnector(parentArrowDown, '~trace', ['from-A']), // TODO: startPrevBlock: true is problematic for set/draw
        // TODO: should really let bullet connector be drawn at the same time
        SetConnector(connector_bulletConnector, [aboveBullet, 0.5, 0.5], [jobCardBullet, 0.5, 0.5]),
        DrawConnector(connector_bulletConnector, '~trace', ['from-A']),
      );
    }
    else {
      animSequence.addBlocks(
        Entrance(jobCard, '~fade-in', []), // TODO: blocksPrev being false wouldn't make the data-display border disappear in parallel
      );
    }
    animSequence.addBlocks(
      Entrance(MAccess, '~fade-in', []),
      Emphasis(MAccessContainer, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_MAccess, [MAccess, 0.5, -0.2], [textbox_MAccess, 0.5, 1]),
      DrawConnector(connector_MAccess, '~trace', ['from-A']),
      Entrance(textbox_MAccess, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // POINT TO M BLOCK ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Point to M block array entry',
    })
    // animSequence.addOneBlock([ 'line', connector_toMBlock, '~wipe', ['right'], MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ]);
    .addBlocks(
      SetConnector(connector_toMBlock, [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toMBlock, '~trace', ['from-A']),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON FORMULA CONTAINER
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Focus on formula container',
    })
    .addBlocks(
      EraseConnector(connector_toMBlock, '~trace', ['from-B']),
      Exit(textbox_MAccess, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_MAccess, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(MAccessContainer, '~un-highlight', []),

      Entrance(arrowContainer, '~wipe', ['from-right']),
      Entrance(formulaComputation, '~fade-in', []),
      Emphasis(formulaComputation, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_formulaComputation, [formulaComputation, 0.1, 0.2], [textbox_formulaComputation, 0.5, 1]),
      DrawConnector(connector_formulaComputation, '~trace', ['from-A']),
      Entrance(textbox_formulaComputation, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON COMPUTATION 1
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Focus on computation 1',
    })
    .addBlocks(
      Exit(textbox_formulaComputation, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_formulaComputation, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(formulaComputation, '~un-highlight', []),

      Emphasis(computationExpression1, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_computation1, [computation1, 0.5, -0.2], [textbox_computation1, 0.5, 1]),
      DrawConnector(connector_computation1, '~trace', ['from-A']),
      Entrance(textbox_computation1, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON C ACCESS
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Focus on c access',
    })
    .addBlocks(
      Exit(textbox_computation1, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_computation1, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(computationExpression1, '~un-highlight', [], {startsNextBlock: true}),
  
      Emphasis(cAccessContainer, '~highlight', []),
      SetConnector(connector_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(connector_cAccess, '~trace', ['from-A']),
      Entrance(textbox_cAccess, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // POINT TO C ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Point to c array entry',
    })
    .addBlocks(
      SetConnector(connector_toCBlock, [cAccessContainer, 0, 0.5], [cBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toCBlock, '~trace', ['from-A']),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // REVERSE ARROW AND REPLACE C ACCESS WITH VALUE
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Reverse arrow and replace c access with value',
    })
    .addBlocks(
      EraseConnector(connector_toCBlock, '~fade-out', []),
      SetConnector(connector_toCBlock, [cBlock, 0.9, 0.5], [cAccessContainer, 0, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toCBlock, '~trace', ['from-A']),
      // TODO: Address SetConnector update dilemma. The commented out code won't work, so I stopped writing it partway through
      // EraseConnector(connector_cAccess, '~fade-out', [], {duration: 0}),
      // SetConnector(connector_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1], {trackEndpoints: true}),
      // DrawConnector(connector_cAccess, '~fade-in', [], {duration: 0}),
      Exit(cAccess, '~wipe', ['from-right']),
      Entrance(cEntry, '~wipe', ['from-right']),

      // SetConnector(connector_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1]),
      // DrawConnector(connector_cAccess, '~fade-in', [], {duration: 0}),
      Exit(paragraph_cAccess_find, '~fade-out', [], { duration: 250 }),
      Entrance(paragraph_cAccess_found, '~fade-in', [], { duration: 250 }),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON OPT EXPRESSION 1 AS A WHOLE
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Focus on OPT expression 1 as a whole',
    })
    .addBlocks(
      // hide arrow for c block
      EraseConnector(connector_toCBlock, '~fade-out', []),
  
      // remove c access text
      Exit(textbox_cAccess, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_cAccess, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(cAccessContainer, '~un-highlight', []),
  
      // enter OPT expression 1 text
      Emphasis(OPTExpressionContainer1, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_OPTExpression1, [OPTExpressionContainer1, 0.5, -0.2], [textbox_OPTExpression1, 0.5, 1]),
      DrawConnector(connector_OPTExpression1, '~trace', ['from-A']),
      Entrance(textbox_OPTExpression1, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }

  /****************************************************** */
  // RECURSION 1
  /****************************************************** */
  const jobCardChild1Content = jobCardChild1.querySelector('.job-card-content') as HTMLElement;
  const connector_upFromChild1 = jobCardChild1Content.querySelector('.connector--up-tree') as Connector;
  const MAccessContainer_fromChild1 = jobCardChild1Content.querySelector('.M-access-container');
  {
    const animSeqPassDown = new AnimSequence({continueNext: true});
    // add blocks to hide text about OPT expression before recursion
    animSeqPassDown.addBlocks(
      Exit(textbox_OPTExpression1, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_OPTExpression1, '~trace', ['from-B']),
    );
    animTimeline.addSequences(animSeqPassDown);
    // generate animation sequences for first child job/stub
    jobCardChild1.classList.contains('job-card--stub') ?
      animateJobStub(jobCardChild1, connector_downTree, OPTExpressionContainer1, jobCardBullet) :
      animateJobCard(jobCardChild1, connector_downTree, OPTExpressionContainer1, jobCardBullet);
    /****************************************************** */
    // REPLACE OPT1 EXPRESSION WITH ANSWER, CHANGE TEXT BOX TEXT
    /****************************************************** */
    const animSequence = new AnimSequence({
      description: 'Replace OPT1 expression with answer, change text box text',
      tag: 'OPT point 1',
      continuePrev: true,
    })
    .addBlocks(
      SetConnector(connector_upFromChild1, [MAccessContainer_fromChild1, 0.5, -0.2], [OPTExpressionContainer1, 0, 1.1]),
      DrawConnector(connector_upFromChild1, '~trace', ['from-A']),
      Exit(OPTExpression1, '~wipe', ['from-right']),
      Entrance(OPTResult1, '~wipe', ['from-right'], {startsNextBlock: true}),
      Exit(paragraph_OPTExpression1_find, '~fade-out', [], { duration: 250 }),
      Entrance(paragraph_OPTExpression1_found, '~fade-in', [], { duration: 250 }),
      SetConnector(connector_OPTExpression1, [OPTResult1, 0.5, -0.2], [textbox_OPTExpression1, 0.5, 1]),
      DrawConnector(connector_OPTExpression1, '~trace', ['from-A']),
      Entrance(textbox_OPTExpression1, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }
  

  /****************************************************** */
  // REMOVE ARROW COMING FROM CHILD, HIDE CURRENT TEXT; REPLACE COMPUTATION EXPRESSION WITH ANSWER; AND FOCUS ON WHOLE COMPUTATION1 (SWAP TEXT AS WELL)
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: `Remove arrow coming from child, hide current text, replace computation expression with answer, and focus on whole computation1 (swap text as well)`,
    })
    .addBlocks(
      EraseConnector(connector_upFromChild1, '~fade-out', [], {startsNextBlock: true}),
      Exit(textbox_OPTExpression1, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_OPTExpression1, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(OPTExpressionContainer1, '~un-highlight', []),
  
      Exit(paragraph_computation1_intro, '~disappear', [], {startsNextBlock: true}), // TODO: blocksNext no longer necessary
      Entrance(paragraph_computation1_summary, '~appear', []), // TODO: blocksPrev no longer necessary
      Exit(computationExpression1, '~wipe', ['from-right'],),
      Entrance(computationResult1, '~wipe', ['from-right'],),
      Emphasis(computationResult1, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_computation1, [computationResult1, 0.5, -0.2], [textbox_computation1, 0.5, 1]),
      DrawConnector(connector_computation1, '~trace', ['from-A']),
      Entrance(textbox_computation1, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON COMPUTATION 2
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Focus on computation 2',
      tag: 'focus comp 2',
    })
    .addBlocks(
      Exit(textbox_computation1, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_computation1, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(computationResult1, '~un-highlight', []),

      Emphasis(computation2, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_computation2, [computation2, 0.5, -0.2], [textbox_computation2, 0.5, 1]),
      DrawConnector(connector_computation2, '~trace', ['from-A']),
      Entrance(textbox_computation2, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // REPLACE SUBTRACTION WITH RESULT; THEN FOCUS ON OPT EXPRESSION 2
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Replace subtraction with result; then focus on OPT expression 2'
    })
    .addBlocks(
      Exit(textbox_computation2, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_computation2, '~trace', ['from-B'], {startsNextBlock: true}),
  
      Exit(nextSJNumExpression, '~wipe', ['from-right']),
      Entrance(nextSJNum, '~wipe', ['from-right']),
  
      SetConnector(connector_OPTExpression2, [computation2, 0.5, -0.2], [textbox_OPTExpression2, 0.5, 1]),
      DrawConnector(connector_OPTExpression2, '~trace', ['from-A']),
      Entrance(textbox_OPTExpression2, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // RECURSION 2
  /****************************************************** */
  const jobCardChild2Content = jobCardChild1.querySelector('.job-card-content') as HTMLElement;
  const connector_upFromChild2 = jobCardChild2Content.querySelector('.connector--up-tree') as Connector;
  const MAccessContainer_fromChild2 = jobCardChild2Content.querySelector('.M-access-container');
  {
    const animSeqPassDown = new AnimSequence({
      continueNext: true,
    })
    .addBlocks(
      Exit(textbox_OPTExpression2, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_OPTExpression2, '~trace', ['from-B']),
    );
    animTimeline.addSequences(animSeqPassDown);
    // create animation sequences for second child card/stub
    jobCardChild2.classList.contains('job-card--stub') ?
      animateJobStub(jobCardChild2, connector_downTree, OPTExpression2, jobCardChild1.querySelector('.job-card-bullet') as HTMLElement) :
      animateJobCard(jobCardChild2, connector_downTree, OPTExpression2, jobCardChild1.querySelector('.job-card-bullet') as HTMLElement);
    /****************************************************** */
    // REPLACE OPT2 EXPRESSION WITH ANSWER, HIDE OLD TEXT, AND ADD COMPUTATION 2 TEXT WITH SWAPPED TEXT
    /****************************************************** */
    const animSequence = new AnimSequence({
      description: 'Replace OPT2 expression with answer, hide old text, and add computation 2 text with swapped text',
      continuePrev: true,
    })
    .addBlocks(
      SetConnector(connector_upFromChild2, [MAccessContainer_fromChild2, 0.5, -0.2], [computation2, 0, 1.1]),
      DrawConnector(connector_upFromChild2, '~trace', ['from-A']),

      Exit(paragraph_computation2_intro, '~disappear', [], {startsNextBlock: true}), // TODO: blocksNext no longer necessary
      Entrance(paragraph_computation2_summary, '~appear', []), // TODO: blocksPrev no longer necessary

      Emphasis(computation2, '~un-highlight', [], {startsNextBlock: true}),
      Exit(OPTExpression2, '~wipe', ['from-right']),
      Entrance(computationResult2, '~wipe', ['from-right'], {startsNextBlock: true}),
      Emphasis(computationResult2, '~highlight', []),

      SetConnector(connector_computation2, [computation2, 0.5, -0.2], [textbox_computation2, 0.5, 1]),
      DrawConnector(connector_computation2, '~trace', ['from-A']),
      Entrance(textbox_computation2, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }
  

  /****************************************************** */
  // FOCUS ON WHOLE FORMULA CONTAINER
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Focus on whole formula container',
    })
    .addBlocks(
      EraseConnector(connector_upFromChild2, '~fade-out', []),
      Exit(textbox_computation2, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_computation2, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(computationResult2, '~un-highlight', []),

      
      Exit(paragraph_formulaComputation_find, '~disappear', [], {startsNextBlock: true}), // TODO: blocksNext no longer necessary
      Entrance(paragraph_formulaComputation_max, '~appear', []),  // TODO: blocksPrev no longer necessary
      Emphasis(formulaContainer, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_formulaComputation, [formulaContainer, 0.5, 0], [textbox_formulaComputation, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(connector_formulaComputation, '~trace', ['from-A']),
      Entrance(textbox_formulaComputation, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // REPLACE FORMULA CONTAINER CONTENTS WITH FINAL ANSWER
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Replace formula container contents with final answer',
      tag: 'replace formula container contents',
    })
    .addBlocks(
      // TODO: Address
      // [ 'line', connector_formulaComputation, 'updateEndpoints', formulaContainer, [0.5, 0], null, [0.5, 1] ],

      Exit(formulaComputation, '~wipe', ['from-right']),
      Entrance(formulaResult, '~wipe', ['from-right'], {startsNextBlock: true}),

      // [ 'line', connector_formulaComputation, 'updateEndpoints', formulaContainer, [0.5, 0], null, [0.5, 1] ],
  
      Exit(paragraph_formulaComputation_max, '~fade-out', [], { duration: 250 }),
      Entrance(paragraph_formulaComputation_found, '~fade-in', [], { duration: 250 }),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // SHOW ONLY M CONTAINER, REPLACE M ACCESS WITH FINAL COMPUTED OPTIMAL VALUE, AND UPDATE M ARRAY BLOCK
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Show only M container, replace M access with final computed optimal value, and update M array block',
      tag: 'found max',
    })
    .addBlocks(
      // hide formula container
      Exit(textbox_formulaComputation, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_formulaComputation, '~trace', ['from-B'], {startsNextBlock: true}),
      Emphasis(formulaContainer, '~un-highlight', [], {startsNextBlock: true}),
      Exit(formulaContainer, '~wipe', ['from-right']),
      Exit(arrowContainer, '~wipe', ['from-right']),
  
      // Visually update M access to final answer
      Exit(MAccess, '~wipe', ['from-right']),
      Entrance(MEntry, '~wipe', ['from-right']),
      Emphasis(MAccessContainer, '~highlight', []),
  
      // Visually update M array entry
      SetConnector(connector_toMBlock, [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toMBlock, '~trace', ['from-right']),
      Exit(MBlock_blank, '~fade-out', []),
      Entrance(MBlock_value, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // REMOVE ARROW POINTING FROM M BLOCK AND SHOW FINAL TEXT BOX
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Remove arrow pointing from M block and show final text box',
    })
    .addBlocks(
      // Add last text box
      Exit(paragraph_MAccess_intro, '~disappear', [], {startsNextBlock: true}), // TODO: blocksNext no longer necessary
      Entrance(paragraph_MAccess_solved, '~appear', []), // TODO: blocksPrev no longer necessary
      EraseConnector(connector_toMBlock, '~trace', ['from-left']),
      SetConnector(connector_MAccess, [MAccessContainer, 0.5, -0.2], [textbox_MAccess, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(connector_MAccess, '~trace', ['from-A']),
      Entrance(textbox_MAccess, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // IF THIS IS A CHILD, ADD BLOCKS FOR HIDING PARENT ARROW BEFORE GOING BACK UP RECURSION TREE
  /****************************************************** */
  if (parentArrowDown) {
    // just for hiding the last text box before moving back up the tree
    const animSequence = new AnimSequence({
      description: 'If this is child block, hide parent arrow and unhighlight M access',
      tag: 'finish a main card',
      continueNext: true,
    })
    .addBlocks(
      Exit(textbox_MAccess, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_MAccess, '~trace', ['from-B']),
      EraseConnector(parentArrowDown, '~fade-out', [], {startsNextBlock: true}),
      Emphasis(MAccessContainer, '~un-highlight', []),
    );

    animTimeline.addSequences(animSequence);
  }
};

// terminal function that creates the animation sequences for job stubs (which are leaves of the job card tree)
function animateJobStub(jobCard: HTMLElement, parentArrowDown: Connector, parentArrowSource: HTMLElement, aboveBullet: HTMLElement) {
  if (!jobCard) { throw new Error('jobCard in animateJobStub() must not be null'); }
  const SJNum = Number.parseInt(jobCard.dataset.sjnum ?? '');
  const jobCardContent = jobCard.querySelector('.job-card-content') as HTMLElement;
  const SJNumLabel = jobCardContent.querySelector('.job-card-SJ-num-label');
  const MAccessContainer = jobCard.querySelector('.M-access-container');
  const MAccess = jobCard.querySelector('.M-access');
  const MEntry = jobCard.querySelector('.M-entry');
  const connector_MAccess = jobCard.querySelector('.text-box-line-group--M-access wbfk-connector') as Connector;
  const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');
  const textbox_MAccess_p1 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--1');
  const textbox_MAccess_p2 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--2');
  const connector_toMBlock = jobCard.querySelector('.connector--M-access-to-M-block') as Connector;


  const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`);

  
  const connector_bulletConnector = jobCard.querySelector('.connector--bullet-connector') as Connector;
  const connector_upTree = jobCard.querySelector('.connector--up-tree');
  const jobCardBullet = jobCard.querySelector('.job-card-bullet');


  /****************************************************** */
  // FADE IN JOB STUB AND M ACCESS
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Fade in job stub and M access',
      continuePrev: true,
    })
    .addBlocks(
      Entrance(jobCard, '~fade-in', [], {startsNextBlock: true}),
      SetConnector(connector_bulletConnector, [aboveBullet, 0.5, 0.5], [jobCardBullet, 0.5, 0.5]),
      // TODO: Pretty sure blocksPrev should be false here?
      DrawConnector(connector_bulletConnector, '~trace', ['from-A']),
      SetConnector(parentArrowDown, [parentArrowSource, 0, 1], [SJNumLabel, 0.5, -0.2]),
      DrawConnector(parentArrowDown, '~trace', ['from-A']),
      Entrance(MAccess, '~fade-in', []),
      Emphasis(MAccessContainer, '~highlight', [], {startsNextBlock: true}),
      SetConnector(connector_MAccess, [MAccessContainer, 0.5, -0.2], [textbox_MAccess, 0.5, 1]),
      DrawConnector(connector_MAccess, '~trace', ['from-A']),
      Entrance(textbox_MAccess, '~fade-in', []),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // POINT TO M BLOCK ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Point to M block array entry',
    })
    .addBlocks(
      SetConnector(connector_toMBlock, [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toMBlock, '~trace', ['from-A']),
    );

    animTimeline.addSequences(animSequence);
  }
  

  /****************************************************** */
  // POINT BACK TO M ACCESS FROM M BLOCK
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Point back to M access from M block',
    })
    .addBlocks(
      EraseConnector(connector_toMBlock, '~fade-out', []),
      SetConnector(connector_toMBlock, [MBlock, 0.9, 0.5], [MAccessContainer, 0, 0.5]),
      DrawConnector(connector_toMBlock, '~trace', ['from-A']),
      // [ 'line', connector_toMBlock, '~fade-out', [], MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
      // [ 'line', connector_toMBlock, '~wipe', ['left'], MBlock, [0.9, 0.5], MAccessContainer, [0, 0.5], {lineOptions: {trackEndpoints: true}} ],
      Exit(MAccess, '~wipe', ['from-right']),
      Entrance(MEntry, '~wipe', ['from-right']),
      Exit(textbox_MAccess_p1, '~fade-out', [], {duration: 250, startsNextBlock: true}),
      Entrance(textbox_MAccess_p2, '~fade-in', [], {duration: 250, startsNextBlock: true, delay: 250}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // RETURN BLOCK THAT INITIALLY HIDES REMAINING STUFF AND POINTS TO PARENT
  /****************************************************** */
  {
    const animSequence = new AnimSequence({
      description: 'Hide parent arrow and unhighlight M access',
      continueNext: true,
    })
    .addBlocks(
      EraseConnector(connector_toMBlock, '~fade-out', [], {startsNextBlock: true}),
      EraseConnector(connector_MAccess, '~trace', ['from-B'], {startsNextBlock: true}),
      Exit(textbox_MAccess, '~fade-out', []),
      EraseConnector(parentArrowDown, '~fade-out', [], {startsNextBlock: true}),
      Emphasis(MAccessContainer, '~un-highlight', []),
    );

    animTimeline.addSequences(animSequence);
  }
};
