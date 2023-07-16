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
const animTimeline = new AnimTimeline(null, {debugMode: true});

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
    const animSequence = new AnimSequence();
    animSequence.setDescription(`Describe that we're about to move bars onto graph`);
    animSequence.addBlocks(
      SetConnector(connector_placeBars, [textbox_placeBars, 0.5, 1], [jobsUnsorted[0].getJobBar(), 0.5, 0]),
      DrawConnector(connector_placeBars, '~trace', ['from-B']),
      Entrance(textbox_placeBars, '~fade-in', [], {blocksPrev: false}),
    );
    animTimeline.addSequences(animSequence);
  }

  /****************************************************** */
  // MOVE JOB BARS ONTO TIME GRAPH IN UNSORTED ORDER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars onto time graph in unsorted order');
    animSequence.addBlocks(
      EraseConnector(connector_placeBars, '~trace', ['from-B'], {blocksNext: false})
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
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars back off of the time graph');
    animSequence.addBlocks(
      Exit(paragraph_placeBars_unorder2, '~fade-out', [], {duration: 250}),
      Entrance(paragraph_placeBars_order, '~fade-in', [], {duration: 250}),
    );
    const jobBarsInitialArea = document.querySelector('.time-graph__job-bars') as HTMLElement;
    jobsUnsorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      animSequence.addBlocks(Translation(jobBarEl, '~move-to', [jobBarsInitialArea], {blocksNext: false, blocksPrev: false}));
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
        Translation(jobBarEl, '~move-to', [startCell], {blocksNext: false}),
        Exit(rowUnsortedLetter, '~wipe', ['from-right'], {blocksPrev: false, duration: 250}),
        Entrance(rowSJNum, '~wipe', ['from-right'], {blocksNext: false, blocksPrev: false, duration: 250}),
        Entrance(rowSortedLetter, '~wipe', ['from-right'], {blocksPrev: false, duration: 250}),
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
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what a compatible job is');
    animSequence.addBlocks(
      Exit(textbox_placeBars, '~fade-out', []),
      Entrance(jArray1, '~wipe', ['from-left']),
      Entrance(cArray, '~wipe', ['from-left'], {blocksPrev: false}),
      Entrance(textbox_cArray, '~fade-in', [], {blocksPrev: false}),
    );
    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // EXPLAIN WHAT C ARRAY WILL BE USED FOR
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what c array will be used for');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence(null, {continueNext: true}); // after hiding, immediately continue into next phase
    animSequence.setDescription(`Hide explanation of c array's purpose and continue into next phase`);
    animSequence.addBlocks(
      Exit(textbox_cArray, '~fade-out', [], {blocksNext: false}),
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
      const animSequence = new AnimSequence(null, {continuePrev: true});
      animSequence.setDescription('Move cbar to current job bar, unhide it, and highlight current job bar and j array block');
      animSequence.addBlocks(
        Translation(cBar, '~move-to', [jobBarEl, {preserveY: true}], {duration: 0}),
        Emphasis(jobBarEl, '~highlight', [], {blocksNext: false}),
        Emphasis(jBlock, '~highlight', [], {blocksNext: false, blocksPrev: false}),
        Entrance(cBar, '~wipe', ['from-top'], {blocksPrev: false}),
        Entrance(paragraph_fillCArray_forJobX, '~fade-in', [], {duration: 0, blocksNext: false}),
        Entrance(textbox_fillCArray, '~fade-in', []),
      );

      animTimeline.addSequences(animSequence);
    }


    // MOVE CBAR, HIGHLIGHT COMPATIBLE JOB IF EXISTS, AND POINT TO C ARRAY
    {
      const animSequence = new AnimSequence();
      const animSequence2 = new AnimSequence();
      animSequence.setDescription('Move cbar and highlight compatible job if it exists');
      animSequence2.setDescription('Point to c array and fill entry');
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
            DrawConnector(timeGraphArrowEl, '~trace', ['from-top'], {blocksPrev: false}),
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
          DrawConnector(timeGraphArrowEl, '~trace', ['from-top'], {blocksPrev: false}),
        );
      }

      animSequence.addBlocks(
        Exit(paragraph_fillCArray_forJobX, '~fade-out', [], {duration: 250}),
        Entrance(paragraph_fillCArray_resultJobX, '~fade-in', [], {duration: 250}),
      )
    
      // "Update" current c-array entry
      animSequence2.addBlocks(
        Exit(cEntryBlank, '~wipe', ['from-right'], {blocksPrev: false, blocksNext: false}),
        Entrance(cEntryValue, '~wipe', ['from-right'], {blocksPrev: false}),
        Exit(paragraph_fillCArray_resultJobX, '~fade-out', [], {duration: 250, blocksPrev: false}),
        Entrance(paragraph_fillCArray_continueOn, '~fade-in', [], {duration: 250}),
      );
    
      animTimeline.addSequences(animSequence);
      animTimeline.addSequences(animSequence2);
    }


    // HIDE CBAR AND ARROW AND UN-HIGHLIGHT EVERYTHING
    {
      const animSequence = new AnimSequence(null, {continueNext: true});
      animSequence.setDescription('Hide cbar and arrow and un-highlight everything');
      if (compatibleJobBarEl) {
        animSequence.addBlocks(
          Emphasis(compatibleJobBarEl, '~un-highlight', [], {blocksNext: false}),
        );
      }
      animSequence.addBlocks(
        EraseConnector(timeGraphArrowEl, '~trace', ['from-bottom'], {blocksNext: false, blocksPrev: false}),
      );
      animSequence.addBlocks(
        Exit(textbox_fillCArray, '~fade-out', [], {blocksPrev: false, blocksNext: false}),
        // [ 'std', paragraph_fillCArray_continueOn, '~fade-out', [], {duration: 0}], // TODO: This being here and having to add blocksNext: false above needs to be considered
        Exit(cBar, '~fade-out', [], {blocksNext: false, blocksPrev: false}),
        Emphasis(jobBarEl, '~un-highlight', [], {blocksPrev: false, blocksNext: false}),
        Emphasis(jBlock, '~un-highlight', [], {blocksPrev: false}),
        Exit(paragraph_fillCArray_continueOn, '~fade-out', [], {duration: 0}),
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
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('State that now we need to find the maximum weight');
    animSequence.setTag('finished c array');
    animSequence.addBlocks(
      Entrance(textbox_finishedCArray, '~fade-in', []),
    );
    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // SHOW NAIVE APPROACH TO FINDING MAX WEIGHT
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain naive approach to finding max weight');
    animSequence.setTag('show naive');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain possibility that job is part of optimal sequence');
    animSequence.setTag('explain naive');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain possibility that job is NOT part of optimal sequence');
    animSequence.setTag('explain naive');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Hide naive approach explanations');
    animSequence.setTag('explain naive bad');
    animSequence.addBlocks(
      Exit(textbox_explainNaive1, '~fade-out', [], {blocksNext: false}),
      Exit(textbox_explainNaive2, '~fade-out', [], {blocksNext: false, blocksPrev: false}),
      EraseConnector(connector_explainNaive1, '~trace', ['from-bottom'], {blocksNext: false}),
      EraseConnector(connector_explainNaive2, '~trace', ['from-bottom'], {blocksNext: false, blocksPrev: false}),
      Emphasis(algorithm_term1, '~un-highlight', [], {blocksNext: false}),
      Emphasis(algorithm_term2, '~un-highlight', [], {blocksPrev: false}),
    );
    animTimeline.addSequences(animSequence);
  }


  const textbox_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad .text-box');
  const connector_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad wbfk-connector') as Connector;
  /****************************************************** */
  // EXPLAIN WHY NAIVE APPROACH IS BAD
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Explain why naive approach is bad');
    animSequence.addBlocks(
      Translation(textbox_explainNaiveBad, '~move-to', [textbox_showNaive, {offsetTargetY: 1, offsetSelfY: '10rem'}], {duration: 0}),
      SetConnector(connector_explainNaiveBad, [textbox_showNaive, 0.5, 1], [textbox_explainNaiveBad, 0.5, 0]),
      DrawConnector(connector_explainNaiveBad, '~trace', ['from-top']),
      Entrance(textbox_explainNaiveBad, '~fade-in', [], {blocksPrev: false}),
    );
    animTimeline.addSequences(animSequence);
  }


  const naiveAlgorithmText = dataDisplay.querySelector('.naive-algorithm-text');
  /****************************************************** */
  // COLLAPSE TEXT BOXES ABOUT THE NAIVE APPROACH
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Collapse text boxes about the naive approach');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Explain memoization');
    animSequence.setTag('introduce memoization');
    animSequence.addBlocks(
      Entrance(jArray2, '~wipe', ['from-left']),
      Entrance(MArray, '~wipe', ['from-left'], {blocksPrev: false}),
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
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what M array will be used for');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence();
    animSequence.setDescription('Show memoized algorithm');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Hide M array text explanation boxes');
    animSequence.addBlocks(
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
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Fade in job card and M access');
    animSequence.setTag('start');
    if (parentArrowDown && parentArrowSource && aboveBullet) {
      const connector_bulletConnector = jobCard.querySelector('.connector--bullet-connector') as Connector;
      animSequence.addBlocks(
        // TODO: need to address the fact that jobCard needs to be revealed first or SJNumLabel's position won't be available below
        Entrance(jobCard, '~fade-in', [], {blocksNext: false}), // TODO: blocksPrev being false wouldn't make the data-display border disappear in parallel
        SetConnector(parentArrowDown, [parentArrowSource, 0, 1], [SJNumLabel, 0.5, -0.2]),
        DrawConnector(parentArrowDown, '~trace', ['from-A'], {blocksPrev: false}), // TODO: blocksPrev: false is problematic for set/draw
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
      Emphasis(MAccessContainer, '~highlight', [], {blocksNext: false, blocksPrev: false}),
      SetConnector(connector_MAccess, [MAccess, 0.5, -0.2], [textbox_MAccess, 0.5, 1]),
      DrawConnector(connector_MAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_MAccess, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // POINT TO M BLOCK ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point to M block array entry');
    // animSequence.addOneBlock([ 'line', connector_toMBlock, '~wipe', ['right'], MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ]);
    animSequence.addBlocks(
      SetConnector(connector_toMBlock, [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toMBlock, '~trace', ['from-A']),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON FORMULA CONTAINER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on formula container');
    animSequence.addBlocks(
      EraseConnector(connector_toMBlock, '~trace', ['from-B']),
      Exit(textbox_MAccess, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_MAccess, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(MAccessContainer, '~un-highlight', []),

      Entrance(arrowContainer, '~wipe', ['from-right']),
      Entrance(formulaComputation, '~fade-in', [], {blocksPrev: false}),
      Emphasis(formulaComputation, '~highlight', [], {blocksNext: false}),
      SetConnector(connector_formulaComputation, [formulaComputation, 0.1, 0.2], [textbox_formulaComputation, 0.5, 1]),
      DrawConnector(connector_formulaComputation, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_formulaComputation, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON COMPUTATION 1
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on computation 1');
    animSequence.addBlocks(
      Exit(textbox_formulaComputation, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_formulaComputation, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(formulaComputation, '~un-highlight', [], {blocksPrev: false}),

      Emphasis(computationExpression1, '~highlight', [], {blocksNext: false}),
      SetConnector(connector_computation1, [computation1, 0.5, -0.2], [textbox_computation1, 0.5, 1]),
      DrawConnector(connector_computation1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation1, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON C ACCESS
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on c access');
    animSequence.addBlocks(
      Exit(textbox_computation1, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_computation1, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(computationExpression1, '~un-highlight', [], {blocksNext: false, blocksPrev: false}),
  
      Emphasis(cAccessContainer, '~highlight', [], {blocksPrev: false}),
      SetConnector(connector_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(connector_cAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_cAccess, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // POINT TO C ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point to c array entry');
    animSequence.addBlocks(
      SetConnector(connector_toCBlock, [cAccessContainer, 0, 0.5], [cBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toCBlock, '~trace', ['from-A'], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // REVERSE ARROW AND REPLACE C ACCESS WITH VALUE
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Reverse arrow and replace c access with value');
    animSequence.addBlocks(
      EraseConnector(connector_toCBlock, '~fade-out', []),
      SetConnector(connector_toCBlock, [cBlock, 0.9, 0.5], [cAccessContainer, 0, 0.5]),
      DrawConnector(connector_toCBlock, '~trace', ['from-A']),
      // TODO: Address SetConnector update dilemma. The commented out code won't work, so I stopped writing it partway through
      // EraseConnector(connector_cAccess, '~fade-out', [], {duration: 0}),
      // SetConnector(connector_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1], {trackEndpoints: true}),
      // DrawConnector(connector_cAccess, '~fade-in', [], {duration: 0}),
      Exit(cAccess, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(cEntry, '~wipe', ['from-right'], {blocksNext: false}),

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
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on OPT expression 1 as a whole');
    animSequence.addBlocks(
      // hide arrow for c block
      EraseConnector(connector_toCBlock, '~fade-out', []),
  
      // remove c access text
      Exit(textbox_cAccess, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_cAccess, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(cAccessContainer, '~un-highlight', [], {blocksPrev: false}),
  
      // enter OPT expression 1 text
      Emphasis(OPTExpressionContainer1, '~highlight', [], {blocksPrev: false, blocksNext: false}),
      SetConnector(connector_OPTExpression1, [OPTExpressionContainer1, 0.5, -0.2], [textbox_OPTExpression1, 0.5, 1]),
      DrawConnector(connector_OPTExpression1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_OPTExpression1, '~fade-in', [], {blocksPrev: false}),
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
    const animSeqPassDown = new AnimSequence(null, {continueNext: true});
    // add blocks to hide text about OPT expression before recursion
    animSeqPassDown.addBlocks(
      Exit(textbox_OPTExpression1, '~fade-out', [], {blocksNext: false}),
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
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Replace OPT1 expression with answer, change text box text');
    animSequence.setTag('OPT point 1');
    animSequence.addBlocks(
      SetConnector(connector_upFromChild1, [MAccessContainer_fromChild1, 0.5, -0.2], [OPTExpressionContainer1, 0, 1.1]),
      DrawConnector(connector_upFromChild1, '~trace', ['from-A']),
      Exit(OPTExpression1, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(OPTResult1, '~wipe', ['from-right'], {blocksNext: false}),
      Exit(paragraph_OPTExpression1_find, '~fade-out', [], { duration: 250 }),
      Entrance(paragraph_OPTExpression1_found, '~fade-in', [], { duration: 250 }),
      SetConnector(connector_OPTExpression1, [OPTResult1, 0.5, -0.2], [textbox_OPTExpression1, 0.5, 1]),
      DrawConnector(connector_OPTExpression1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_OPTExpression1, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }
  

  /****************************************************** */
  // REMOVE ARROW COMING FROM CHILD, HIDE CURRENT TEXT; REPLACE COMPUTATION EXPRESSION WITH ANSWER; AND FOCUS ON WHOLE COMPUTATION1 (SWAP TEXT AS WELL)
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription(`Remove arrow coming from child, hide current text, replace computation expression with answer, and focus on whole computation1 (swap text as well)`);
    animSequence.addBlocks(
      EraseConnector(connector_upFromChild1, '~fade-out', [], {blocksNext: false}),
      Exit(textbox_OPTExpression1, '~fade-out', [], {blocksPrev: false, blocksNext: false}),
      EraseConnector(connector_OPTExpression1, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(OPTExpressionContainer1, '~un-highlight', [], {blocksPrev: false}),
  
      Exit(paragraph_computation1_intro, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(paragraph_computation1_summary, '~fade-in', [], {duration: 0, blocksPrev: false}),
      Exit(computationExpression1, '~wipe', ['from-right'],),
      Entrance(computationResult1, '~wipe', ['from-right'],),
      Emphasis(computationResult1, '~highlight', [], {blocksPrev: false, blocksNext: false}),
      SetConnector(connector_computation1, [computationResult1, 0.5, -0.2], [textbox_computation1, 0.5, 1]),
      DrawConnector(connector_computation1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation1, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // FOCUS ON COMPUTATION 2
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on computation 2');
    animSequence.setTag('focus comp 2');
    animSequence.addBlocks(
      Exit(textbox_computation1, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_computation1, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(computationResult1, '~un-highlight', [], {blocksPrev: false}),

      Emphasis(computation2, '~highlight', [], {blocksNext: false}),
      SetConnector(connector_computation2, [computation2, 0.5, -0.2], [textbox_computation2, 0.5, 1]),
      DrawConnector(connector_computation2, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation2, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // REPLACE SUBTRACTION WITH RESULT; THEN FOCUS ON OPT EXPRESSION 2
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Replace subtraction with result; then focus on OPT expression 2');
    animSequence.addBlocks(
      Exit(textbox_computation2, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_computation2, '~trace', ['from-B'], {blocksNext: false}),
  
      Exit(nextSJNumExpression, '~wipe', ['from-right']),
      Entrance(nextSJNum, '~wipe', ['from-right']),
  
      SetConnector(connector_OPTExpression2, [computation2, 0.5, -0.2], [textbox_OPTExpression2, 0.5, 1]),
      DrawConnector(connector_OPTExpression2, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_OPTExpression2, '~fade-in', [], {blocksPrev: false}),
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
    const animSeqPassDown = new AnimSequence(null, {continueNext: true});
    animSeqPassDown.addBlocks(
      Exit(textbox_OPTExpression2, '~fade-out', [], {blocksNext: false}),
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
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Replace OPT2 expression with answer, hide old text, and add computation 2 text with swapped text');
    animSequence.addBlocks(
      SetConnector(connector_upFromChild2, [MAccessContainer_fromChild2, 0.5, -0.2], [computation2, 0, 1.1]),
      DrawConnector(connector_upFromChild2, '~trace', ['from-A']),

      Exit(paragraph_computation2_intro, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(paragraph_computation2_summary, '~fade-in', [], {duration: 0, blocksPrev: false}),

      Emphasis(computation2, '~un-highlight', [], {blocksNext: false}),
      Exit(OPTExpression2, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(computationResult2, '~wipe', ['from-right'], {blocksNext: false}),
      Emphasis(computationResult2, '~highlight', [], {blocksPrev: false}),

      SetConnector(connector_computation2, [computation2, 0.5, -0.2], [textbox_computation2, 0.5, 1]),
      DrawConnector(connector_computation2, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation2, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }
  

  /****************************************************** */
  // FOCUS ON WHOLE FORMULA CONTAINER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on whole formula container');
    animSequence.addBlocks(
      EraseConnector(connector_upFromChild2, '~fade-out', []),
      Exit(textbox_computation2, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_computation2, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(computationResult2, '~un-highlight', [], {blocksPrev: false}),

      
      Exit(paragraph_formulaComputation_find, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(paragraph_formulaComputation_max, '~fade-in', [], {duration: 0, blocksPrev: false}),
      Emphasis(formulaContainer, '~highlight', [], {blocksNext: false}),
      SetConnector(connector_formulaComputation, [formulaContainer, 0.5, 0], [textbox_formulaComputation, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(connector_formulaComputation, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_formulaComputation, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // REPLACE FORMULA CONTAINER CONTENTS WITH FINAL ANSWER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setTag('replace formula container contents');
    animSequence.setDescription('Replace formula container contents with final answer');
    animSequence.addBlocks(
      // TODO: Address
      // [ 'line', connector_formulaComputation, 'updateEndpoints', formulaContainer, [0.5, 0], null, [0.5, 1] ],

      Exit(formulaComputation, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(formulaResult, '~wipe', ['from-right'], {blocksNext: false}),

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
    const animSequence = new AnimSequence();
    animSequence.setDescription('Show only M container, replace M access with final computed optimal value, and update M array block');
    animSequence.setTag('found max');
    animSequence.addBlocks(
      // hide formula container
      Exit(textbox_formulaComputation, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_formulaComputation, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(formulaContainer, '~un-highlight', [], {blocksNext: false}),
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
    const animSequence = new AnimSequence();
    animSequence.setDescription('Remove arrow pointing from M block and show final text box');
    animSequence.addBlocks(
      // Add last text box
      Exit(paragraph_MAccess_intro, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(paragraph_MAccess_solved, '~fade-in', [], {duration: 0, blocksPrev: false}),
      EraseConnector(connector_toMBlock, '~trace', ['from-A']),
      SetConnector(connector_MAccess, [MAccessContainer, 0.5, -0.2], [textbox_MAccess, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(connector_MAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_MAccess, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // IF THIS IS A CHILD, ADD BLOCKS FOR HIDING PARENT ARROW BEFORE GOING BACK UP RECURSION TREE
  /****************************************************** */
  if (parentArrowDown) {
    // just for hiding the last text box before moving back up the tree
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('If this is child block, hide parent arrow and unhighlight M access');
    animSequence.setTag('finish a main card');
    animSequence.addBlocks(
      Exit(textbox_MAccess, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_MAccess, '~trace', ['from-B']),
      EraseConnector(parentArrowDown, '~fade-out', [], {blocksNext: false}),
      Emphasis(MAccessContainer, '~un-highlight', [], {blocksPrev: false}),
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
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Fade in job stub and M access');
    animSequence.addBlocks(
      Entrance(jobCard, '~fade-in', [], {blocksNext: false}),
      SetConnector(connector_bulletConnector, [aboveBullet, 0.5, 0.5], [jobCardBullet, 0.5, 0.5]),
      // TODO: Pretty sure blocksPrev should be false here?
      DrawConnector(connector_bulletConnector, '~trace', ['from-A']),
      SetConnector(parentArrowDown, [parentArrowSource, 0, 1], [SJNumLabel, 0.5, -0.2]),
      DrawConnector(parentArrowDown, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(MAccess, '~fade-in', []),
      Emphasis(MAccessContainer, '~highlight', [], {blocksNext: false, blocksPrev: false}),
      SetConnector(connector_MAccess, [MAccessContainer, 0.5, -0.2], [textbox_MAccess, 0.5, 1]),
      DrawConnector(connector_MAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_MAccess, '~fade-in', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // POINT TO M BLOCK ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point to M block array entry');
    animSequence.addBlocks(
      SetConnector(connector_toMBlock, [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(connector_toMBlock, '~trace', ['from-A']),
    );

    animTimeline.addSequences(animSequence);
  }
  

  /****************************************************** */
  // POINT BACK TO M ACCESS FROM M BLOCK
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point back to M access from M block');
    animSequence.addBlocks(
      EraseConnector(connector_toMBlock, '~fade-out', []),
      SetConnector(connector_toMBlock, [MBlock, 0.9, 0.5], [MAccessContainer, 0, 0.5]),
      DrawConnector(connector_toMBlock, '~trace', ['from-A']),
      // [ 'line', connector_toMBlock, '~fade-out', [], MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
      // [ 'line', connector_toMBlock, '~wipe', ['left'], MBlock, [0.9, 0.5], MAccessContainer, [0, 0.5], {lineOptions: {trackEndpoints: true}} ],
      Exit(MAccess, '~wipe', ['from-right']),
      Entrance(MEntry, '~wipe', ['from-right']),
      Exit(textbox_MAccess_p1, '~fade-out', [], {duration: 250, blocksNext: false}),
      Entrance(textbox_MAccess_p2, '~fade-in', [], {duration: 250, blocksNext: false}),
    );

    animTimeline.addSequences(animSequence);
  }


  /****************************************************** */
  // RETURN BLOCK THAT INITIALLY HIDES REMAINING STUFF AND POINTS TO PARENT
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Hide parent arrow and unhighlight M access');
    animSequence.addBlocks(
      EraseConnector(connector_toMBlock, '~fade-out', [], {blocksNext: false}),
      EraseConnector(connector_MAccess, '~trace', ['from-B'], {blocksPrev: false, blocksNext: false}),
      Exit(textbox_MAccess, '~fade-out', [], {blocksPrev: false}),
      EraseConnector(parentArrowDown, '~fade-out', [], {blocksNext: false}),
      Emphasis(MAccessContainer, '~un-highlight', [], {blocksPrev: false}),
    );

    animTimeline.addSequences(animSequence);
  }
};
