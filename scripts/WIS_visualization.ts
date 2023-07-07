import { setupPlaybackControls } from './playbackControls.js';
import { JobScheduler } from './JobScheduler.js';
import { SceneCreator } from './SceneCreator.js';
import { AnimSequence } from './AnimSequence.js';
import { AnimTimeline } from "./AnimTimeline.js";
import { WebFlik } from './TestUsability/WebFlik.js';
import { Connector } from './AnimBlockLine.js';

// \[\s'std',\s(.*'~)(high|un-high)(.*')(.*)\s\]
// (\s*)(\[ 'line)


const dataDisplay = document.querySelector('.data-display');
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

export function generateVisualization (jobsUnsorted) {
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
  setUpFreeLinesArrows();
  animateDataDisplay(dataDisplay, jobScheduler);
  animateJobCard(document.querySelector('.job-card')); // naturally starts at the root job card
  setupPlaybackControls(animTimeline);
};

// allows the data display (left view with the time graph and arrays) to scroll horizontally
function setUpDataDisplayScroll (dataDisplay) {
  document.addEventListener('scroll', function(e) {
    dataDisplay.style.left = `${-window.scrollX}px`;
  });
};

// sets up the markers for free lines that are arrows
function setUpFreeLinesArrows() {
  const freeLineArrows = [...document.querySelectorAll('.free-line--arrow')];
  freeLineArrows.forEach((freeLine, i) => {
    const line = freeLine.querySelector('.free-line__line');
    const marker = freeLine.querySelector('marker');

    const id = `markerArrow--${i}`;
    marker.id = id;
    line.style.markerEnd = `url(#${id})`;
  });
};

// creates animation sequences for the data display
function animateDataDisplay(dataDisplay, jobScheduler) {
  const timeGraphEl = document.querySelector('.time-graph')!;
  const jobsUnsorted = jobScheduler.getJobsUnsorted();
  const jobsSorted = jobScheduler.getJobs();


  const textbox_placeBars = dataDisplay.querySelector('.text-box-line-group--place-bars .text-box');
  const connector_placeBars = dataDisplay.querySelector('.text-box-line-group--place-bars wbfk-connector');
  const textP_placeBars_unorder = textbox_placeBars.querySelector('.text-box__paragraph--unorder');
  const textP_placeBars_unorder2 = textbox_placeBars.querySelector('.text-box__paragraph--unorder-2');
  const textP_placeBars_order = textbox_placeBars.querySelector('.text-box__paragraph--order');
  const textP_placeBars_ordered = textbox_placeBars.querySelector('.text-box__paragraph--ordered');

  /****************************************************** */
  // DESCRIBE THAT WE'RE ABOUT TO MOVE BARS ONTO GRAPH
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription(`Describe that we're about to move bars onto graph`);
    animSequence.addManyBlocks([
      SetConnector(connector_placeBars, [textbox_placeBars, 0.5, 1], [jobsUnsorted[0].getJobBar(), 0.5, 0]),
      DrawConnector(connector_placeBars, '~trace', ['from-B']),
      Entrance(textbox_placeBars, '~fade-in', [], {blocksPrev: false}),
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  /****************************************************** */
  // MOVE JOB BARS ONTO TIME GRAPH IN UNSORTED ORDER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars onto time graph in unsorted order');
    animSequence.addOneBlock(
      EraseConnector(connector_placeBars, '~trace', ['from-B'], {blocksNext: false})
    );
    jobsUnsorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      // set up options for moving job bars to correct location
      const jobLetter = jobBarEl.dataset.jobletter;
      const startCell = document.querySelector(`.time-graph__row[data-jobletterunsorted="${jobLetter}"]  .time-graph__cell--${jobBarEl.dataset.start}`) as HTMLElement;
      animSequence.addOneBlock(Translation(jobBarEl, '~move-to', [startCell]));
    });
    animSequence.addManyBlocks([
      Exit(textP_placeBars_unorder, '~fade-out', [], {duration: 250}),
      Entrance(textP_placeBars_unorder2, '~fade-in', [], {duration: 250}),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // MOVE JOB BARS BACK OFF OF THE TIME GRAPH
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Move job bars back off of the time graph');
    animSequence.addManyBlocks([
      Exit(textP_placeBars_unorder2, '~fade-out', [], {duration: 250}),
      Entrance(textP_placeBars_order, '~fade-in', [], {duration: 250}),
    ]);
    const jobBarsInitialArea = document.querySelector('.time-graph__job-bars') as HTMLElement;
    jobsUnsorted.forEach((job) => {
      const jobBarEl = job.getJobBar();
      animSequence.addOneBlock(Translation(jobBarEl, '~move-to', [jobBarsInitialArea], {blocksNext: false, blocksPrev: false}));
    });

    animTimeline.addOneSequence(animSequence);
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
      const row = document.querySelector(`.time-graph__row[data-joblettersorted="${jobLetter}"]`)!;
      const startCell = row.querySelector(`.time-graph__cell--${jobBarEl.dataset.start}`);
      
      // get row's header data to animate
      const rowSJNum = row.querySelector('.time-graph__SJ-num');
      const rowUnsortedLetter = row.querySelector('.time-graph__job-letter--unsorted');
      const rowSortedLetter = row.querySelector('.time-graph__job-letter--sorted');
      
      animSequence.addManyBlocks([
        Translation(jobBarEl, '~move-to', [startCell], {blocksNext: false}),
        Exit(rowUnsortedLetter, '~wipe', ['from-right'], {blocksPrev: false, duration: 250}),
        Entrance(rowSJNum, '~wipe', ['from-right'], {blocksNext: false, blocksPrev: false, duration: 250}),
        Entrance(rowSortedLetter, '~wipe', ['from-right'], {blocksPrev: false, duration: 250}),
      ]);
    });

    animSequence.addManyBlocks([
      Exit(textP_placeBars_order, '~fade-out', [], {duration: 250}),
      Entrance(textP_placeBars_ordered, '~fade-in', [], {duration: 250}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  const arrayGroup_j_c = dataDisplay.querySelector('.array-group--j-and-c');
  const cArray = arrayGroup_j_c.querySelector('.array--c');
  const jArray1 = arrayGroup_j_c.querySelector('.array--j');
  const textbox_cArray = dataDisplay.querySelector('.text-box-line-group--c-array .text-box');
  const freeLine_cArray = dataDisplay.querySelector('.text-box-line-group--c-array wbfk-connector');
  const textP_cArray_explain = textbox_cArray.querySelector('.text-box__paragraph--explain');
  const textP_cArray_refArray = textbox_cArray.querySelector('.text-box__paragraph--ref-array');
  /****************************************************** */
  // EXPLAIN WHAT A COMPATIBLE JOB IS
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what a compatible job is');
    animSequence.addManyBlocks([
      Exit(textbox_placeBars, '~fade-out', []),
      Entrance(jArray1, '~wipe', ['from-left']),
      Entrance(cArray, '~wipe', ['from-left'], {blocksPrev: false}),
      Entrance(textbox_cArray, '~fade-in', [], {blocksPrev: false}),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // EXPLAIN WHAT C ARRAY WILL BE USED FOR
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what c array will be used for');
    animSequence.addManyBlocks([
      SetConnector(freeLine_cArray, [textbox_cArray, 0, 0.5], [cArray, 1, 0.5]),
      DrawConnector(freeLine_cArray, '~trace', ['from-B']),
      Exit(textP_cArray_explain, '~fade-out', [], {duration: 250}),
      Entrance(textP_cArray_refArray, '~fade-in', [], {duration: 250}),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // HIDE EXPLANATION OF C ARRAY'S PURPOSE AND CONTINUE INTO NEXT PHASE
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continueNext: true}); // after hiding, immediately continue into next phase
    animSequence.setDescription(`Hide explanation of c array's purpose and continue into next phase`);
    animSequence.addManyBlocks([
      Exit(textbox_cArray, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_cArray, '~trace', ['from-A']),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // DEMONSTRATE HOW TO FILL OUT THE C ARRAY
  /****************************************************** */
  const textbox_fillCArray = dataDisplay.querySelector('.text-box-line-group--fill-c-array .text-box');
  const cBar = document.querySelector('.time-graph__c-bar'); // vertical bar
  const timeGraphArrowEl = timeGraphEl.querySelector('wbfk-connector') as Connector; // arrow connecting c entry and compatible job's row header
  jobsSorted.forEach((job) => {
    const jobBarEl = job.getJobBar();
    // get j array block corresponding to current job bar
    const jBlock = document.querySelector(`.array-group--j-and-c .array--j .array__array-block--${jobBarEl.dataset.sjnum}`);
    // Find job bar corresponding to the job that's compatible with the current job (if it exists)
    const compatibleJobBarEl = document.querySelector(`.time-graph__job-bar[data-sjnum="${jobBarEl.dataset.compatiblejobnum}"]`) as HTMLElement;
    // get the c array entry corresponding to the current job
    const cBlock = cArray.querySelector(`.array__array-block--${jobBarEl.dataset.sjnum}`);
    const cEntryValue = cBlock.querySelector(`.array__array-entry--value`);
    const cEntryBlank = cBlock.querySelector(`.array__array-entry--blank`);
    let row;
    let rowSJNum;

    const textP_fillCArray_forJobX = textbox_fillCArray.querySelector(`.text-box__paragraph--for-job-${jobBarEl.dataset.sjnum}`);
    const textP_fillCArray_resultJobX = textbox_fillCArray.querySelector(`.text-box__paragraph--result-job-${jobBarEl.dataset.sjnum}`);
    const textP_fillCArray_continueOn = textbox_fillCArray.querySelector(`.text-box__paragraph--continue-on`);

    // MOVE CBAR TO CURRENT JOB BAR, UNHIDE IT, AND HIGHLIGHT CURRENT JOB BAR AND J ARRAY BLOCK
    {
      const animSequence = new AnimSequence(null, {continuePrev: true});
      animSequence.setDescription('Move cbar to current job bar, unhide it, and highlight current job bar and j array block');
      animSequence.addManyBlocks([
        Translation(cBar, '~move-to', [jobBarEl, {preserveY: true}], {duration: 0}),
        Emphasis(jobBarEl, '~highlight', [], {blocksNext: false}),
        Emphasis(jBlock, '~highlight', [], {blocksNext: false, blocksPrev: false}),
        Entrance(cBar, '~wipe', ['from-top'], {blocksPrev: false}),
        Entrance(textP_fillCArray_forJobX, '~fade-in', [], {duration: 0, blocksNext: false}),
        Entrance(textbox_fillCArray, '~fade-in', []),
      ]);

      animTimeline.addOneSequence(animSequence);
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
        row = document.querySelector(`.time-graph__row[data-joblettersorted="${compatibleJobBarEl.dataset.jobletter}"]`)!;
        rowSJNum = row.querySelector('.time-graph__SJ-num');
        animSequence.addManyBlocks([
          Translation(cBar, '~move-to', [compatibleJobBarEl, {alignmentX: 'right', preserveY: true}]),
          Emphasis(compatibleJobBarEl, '~highlight', []),
        ]);
        animSequence2.addManyBlocks([
            SetConnector(timeGraphArrowEl, [rowSJNum, 1, 0.5], [cBlock, 0.5, 0]),
            DrawConnector(timeGraphArrowEl, '~trace', ['from-top'], {blocksPrev: false}),
        ]);
      }
      // If no compatible job exists, move cbar to left of time graph
      // Then point arrow from bottom of cbar to current c-array entry
      else {
        animSequence.addManyBlocks([
          Translation(cBar, '~move-to', [timeGraphEl, {alignmentX: 'left', preserveY: true}]),
        ]);
        animSequence2.addManyBlocks([
          SetConnector(timeGraphArrowEl, [cBar, 0, 1], [cBlock, 0.5, 0]),
          DrawConnector(timeGraphArrowEl, '~trace', ['from-top'], {blocksPrev: false}),
        ]);
      }

      animSequence.addManyBlocks([
        Exit(textP_fillCArray_forJobX, '~fade-out', [], {duration: 250}),
        Entrance(textP_fillCArray_resultJobX, '~fade-in', [], {duration: 250}),
      ])
    
      // "Update" current c-array entry
      animSequence2.addManyBlocks([
        Exit(cEntryBlank, '~wipe', ['from-right'], {blocksPrev: false, blocksNext: false}),
        Entrance(cEntryValue, '~wipe', ['from-right'], {blocksPrev: false}),
        Exit(textP_fillCArray_resultJobX, '~fade-out', [], {duration: 250, blocksPrev: false}),
        Entrance(textP_fillCArray_continueOn, '~fade-in', [], {duration: 250}),
      ]);
    
      animTimeline.addOneSequence(animSequence);
      animTimeline.addOneSequence(animSequence2);
    }


    // HIDE CBAR AND ARROW AND UN-HIGHLIGHT EVERYTHING
    {
      const animSequence = new AnimSequence(null, {continueNext: true});
      animSequence.setDescription('Hide cbar and arrow and un-highlight everything');
      if (compatibleJobBarEl) {
        animSequence.addManyBlocks([
          Emphasis(compatibleJobBarEl, '~un-highlight', [], {blocksNext: false}),
        ]);
      }
      animSequence.addManyBlocks([
        EraseConnector(timeGraphArrowEl, '~trace', ['from-bottom'], {blocksNext: false, blocksPrev: false}),
      ]);
      animSequence.addManyBlocks([
        Exit(textbox_fillCArray, '~fade-out', [], {blocksPrev: false, blocksNext: false}),
        // [ 'std', textP_fillCArray_continueOn, '~fade-out', [], {duration: 0}], // TODO: This being here and having to add blocksNext: false above needs to be considered
        Exit(cBar, '~fade-out', [], {blocksNext: false, blocksPrev: false}),
        Emphasis(jobBarEl, '~un-highlight', [], {blocksPrev: false, blocksNext: false}),
        Emphasis(jBlock, '~un-highlight', [], {blocksPrev: false}),
        Exit(textP_fillCArray_continueOn, '~fade-out', [], {duration: 0}),
      ]);
      animTimeline.addOneSequence(animSequence);
    }
  });


  const textbox_finishedCArray = dataDisplay.querySelector('.text-box-line-group--finished-c-array .text-box');
  const freeLine_showNaive = dataDisplay.querySelector('.text-box-line-group--show-naive wbfk-connector') as Connector;
  const textbox_showNaive = dataDisplay.querySelector('.text-box-line-group--show-naive .text-box');
  const algorithm_term1 = textbox_showNaive.querySelector('.algorithm__term-1');
  const algorithm_term2 = textbox_showNaive.querySelector('.algorithm__term-2');
  /****************************************************** */
  // STATE THAT NOW WE NEED TO FIND THE MAXIMUM WEIGHT
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('State that now we need to find the maximum weight');
    animSequence.setTag('finished c array');
    animSequence.addManyBlocks([
      Entrance(textbox_finishedCArray, '~fade-in', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // SHOW NAIVE APPROACH TO FINDING MAX WEIGHT
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain naive approach to finding max weight');
    animSequence.setTag('show naive');
    animSequence.addManyBlocks([
      Translation(textbox_showNaive, '~move-to', [textbox_finishedCArray, {offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem'}], {duration: 0}),
      SetConnector(freeLine_showNaive, [textbox_finishedCArray, 0.5, 1], [textbox_showNaive, 0.5, 0]),
      DrawConnector(freeLine_showNaive, '~trace', ['from-top']),
      Entrance(textbox_showNaive, '~fade-in', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const textbox_explainNaive1 = dataDisplay.querySelector('.text-box-line-group--explain-naive-1 .text-box');
  const freeLine_explainNaive1 = dataDisplay.querySelector('.text-box-line-group--explain-naive-1 wbfk-connector') as Connector;
  /****************************************************** */
  // EXPLAIN POSSIBILITY THAT JOB IS PART OF OPTIMAL SEQUENCE
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain possibility that job is part of optimal sequence');
    animSequence.setTag('explain naive');
    animSequence.addManyBlocks([
      Translation(textbox_explainNaive1, '~move-to', [textbox_showNaive, {offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem', offsetTargetX: -1.0, offsetX: 10, offsetUnitsX: 'rem'}], {duration: 0}),
      Emphasis(algorithm_term1, '~highlight', []),
      SetConnector(freeLine_explainNaive1, [algorithm_term1, 0.5, 1], [textbox_explainNaive1, 0.5, 0]),
      DrawConnector(freeLine_explainNaive1, '~trace', ['from-top']),
      Entrance(textbox_explainNaive1, '~fade-in', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const textbox_explainNaive2 = dataDisplay.querySelector('.text-box-line-group--explain-naive-2 .text-box');
  const freeLine_explainNaive2 = dataDisplay.querySelector('.text-box-line-group--explain-naive-2 wbfk-connector') as Connector;
  /****************************************************** */
  // EXPLAIN POSSIBILITY THAT JOB IS **NOT** PART OF OPTIMAL SEQUENCE
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null);
    animSequence.setDescription('Explain possibility that job is NOT part of optimal sequence');
    animSequence.setTag('explain naive');
    animSequence.addManyBlocks([
      Translation(textbox_explainNaive2, '~move-to', [textbox_showNaive, {offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem', offsetTargetX: 1.0, offsetX: -10, offsetUnitsX: 'rem', alignmentX: 'right'}], {duration: 0}),
      Emphasis(algorithm_term2, '~highlight', []),
      SetConnector(freeLine_explainNaive2, [algorithm_term2, 0.5, 1], [textbox_explainNaive2, 0.5, 0]),
      DrawConnector(freeLine_explainNaive2, '~trace', ['from-top']),
      Entrance(textbox_explainNaive2, '~fade-in', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  /****************************************************** */
  // HIDE NAIVE APPROACH EXPLANATIONS
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Hide naive approach explanations');
    animSequence.setTag('explain naive bad');
    animSequence.addManyBlocks([
      Exit(textbox_explainNaive1, '~fade-out', [], {blocksNext: false}),
      Exit(textbox_explainNaive2, '~fade-out', [], {blocksNext: false, blocksPrev: false}),
      EraseConnector(freeLine_explainNaive1, '~trace', ['from-bottom'], {blocksNext: false}),
      EraseConnector(freeLine_explainNaive2, '~trace', ['from-bottom'], {blocksNext: false, blocksPrev: false}),
      Emphasis(algorithm_term1, '~un-highlight', [], {blocksNext: false}),
      Emphasis(algorithm_term2, '~un-highlight', [], {blocksPrev: false}),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const textbox_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad .text-box');
  const freeLine_explainNaiveBad = dataDisplay.querySelector('.text-box-line-group--explain-naive-bad wbfk-connector') as Connector;
  /****************************************************** */
  // EXPLAIN WHY NAIVE APPROACH IS BAD
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Explain why naive approach is bad');
    animSequence.addManyBlocks([
      Translation(textbox_explainNaiveBad, '~move-to', [textbox_showNaive, {offsetTargetY: 1, offsetY: 10, offsetUnitsY: 'rem'}], {duration: 0}),
      SetConnector(freeLine_explainNaiveBad, [textbox_showNaive, 0.5, 1], [textbox_explainNaiveBad, 0.5, 0]),
      DrawConnector(freeLine_explainNaiveBad, '~trace', ['from-top']),
      Entrance(textbox_explainNaiveBad, '~fade-in', [], {blocksPrev: false}),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const naiveAlgorithmText = dataDisplay.querySelector('.naive-algorithm-text');
  /****************************************************** */
  // COLLAPSE TEXT BOXES ABOUT THE NAIVE APPROACH
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Collapse text boxes about the naive approach');
    animSequence.addManyBlocks([
      Exit(naiveAlgorithmText, '~fade-out', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const arrayGroup_j_M = dataDisplay.querySelector('.array-group--j-and-M');
  const MArray = arrayGroup_j_M.querySelector('.array--M');
  const jArray2 = arrayGroup_j_M.querySelector('.array--j');
  const textbox_MArray = dataDisplay.querySelector('.text-box-line-group--M-array .text-box');
  const freeLine_MArray = dataDisplay.querySelector('.text-box-line-group--M-array wbfk-connector') as Connector;
  const textP_MArray_explain = textbox_MArray.querySelector('.text-box__paragraph--explain');
  const textP_MArray_refArray = textbox_MArray.querySelector('.text-box__paragraph--ref-array');
  /****************************************************** */
  // EXPLAIN MEMOIZATION
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Explain memoization');
    animSequence.setTag('introduce memoization');
    animSequence.addManyBlocks([
      Entrance(jArray2, '~wipe', ['from-left']),
      Entrance(MArray, '~wipe', ['from-left'], {blocksPrev: false}),
      Entrance(textbox_MArray, '~fade-in', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }

  const arrayBlock_M_0 = MArray.querySelector('.array__array-block--0');
  const arrayBlank_M_0 = arrayBlock_M_0.querySelector('.array__array-entry--blank');
  const arrayValue_M_0 = arrayBlock_M_0.querySelector('.array__array-entry--value');
  /****************************************************** */
  // EXPLAIN WHAT M ARRAY WILL BE USED FOR
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Explain what M array will be used for');
    animSequence.addManyBlocks([
      SetConnector(freeLine_MArray, [textbox_MArray, 0, 0.5], [MArray, 1, 0.5]),
      DrawConnector(freeLine_MArray, '~trace', ['from-B']),
      Exit( textP_MArray_explain, '~fade-out', [], {duration: 250}),
      Entrance( textP_MArray_refArray, '~fade-in', [], {duration: 250}),
      Exit(arrayBlank_M_0, '~fade-out', []),
      Entrance(arrayValue_M_0, '~fade-in', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const textbox_showMemoized = dataDisplay.querySelector('.text-box-line-group--show-memoized .text-box');
  const freeLine_showMemoized = dataDisplay.querySelector('.text-box-line-group--show-memoized wbfk-connector') as Connector;
  /****************************************************** */
  // SHOW MEMOIZED ALGORITHM
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Show memoized algorithm');
    animSequence.addManyBlocks([
      Translation(textbox_showMemoized, '~move-to', [textbox_MArray, {offsetTargetX: 1, offsetX: 6.25, offsetUnitsX: 'rem', preserveY: true}], {duration: 0}),
      SetConnector(freeLine_showMemoized, [textbox_MArray, 1, 0.5], [textbox_showMemoized, 0, 0.5]),
      DrawConnector(freeLine_showMemoized, '~trace', ['from-A']),
      Entrance( textbox_showMemoized, '~fade-in', []),
    ]);
    animTimeline.addOneSequence(animSequence);
  }


  const MArrayTextBoxes = MArray.querySelector('.text-boxes');
  const dataDisplayBorder = dataDisplay.querySelector('.data-display__right-border');
  /****************************************************** */
  // HIDE M ARRAY TEXT EXPLANATION BOXES
  /****************************************************** */
  {
    const animSequence = new AnimSequence(null, {continueNext: true});
    animSequence.setDescription('Hide M array text explanation boxes');
    animSequence.addManyBlocks([
      Exit(MArrayTextBoxes, '~fade-out', []),
      Entrance(dataDisplayBorder, '~wipe', ['from-top']),
    ]);
    animTimeline.addOneSequence(animSequence);
  }
};

// recursively creates animation sequences for the job card tree
function animateJobCard(jobCard: HTMLElement | null, parentAnimSequence: AnimSequence, parentArrowDown: Connector, parentArrowSource: Element, aboveBullet: Element): any;
function animateJobCard(jobCard: HTMLElement | null): any;
function animateJobCard(jobCard: HTMLElement | null, parentAnimSequence?: AnimSequence, parentArrowDown?: Connector, parentArrowSource?: Element, aboveBullet?: Element) {
  if (!jobCard) { throw new Error('jobCard in animateJobCard() must not be null'); }
  const SJNum = Number.parseInt(jobCard.dataset.sjnum);
  const jobCardContent = jobCard.querySelector('.job-card-content');
  const SJNumLabel = jobCardContent.querySelector('.job-card-SJ-num-label');
  const MAccessContainer = jobCard.querySelector('.M-access-container');
  const MAccess = jobCard.querySelector('.M-access');
  const MEntry = jobCard.querySelector('.M-entry');
  const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access wbfk-connector') as Connector;
  const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');
  const textP_MAccess_intro = textbox_MAccess.querySelector('.text-box__paragraph--intro');
  const textP_MAccess_solved = textbox_MAccess.querySelector('.text-box__paragraph--solved');

  const freeLine_toMBlock = jobCard.querySelector('.free-line--M-access-to-M-block') as Connector;


  const arrowContainer = jobCard.querySelector('.arrow-container');
  const formulaContainer = jobCard.querySelector('.formula-container');
  const formulaComputation = jobCard.querySelector('.formula-computation');
  const formulaResult = jobCard.querySelector('.formula-result');
  const freeLine_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation wbfk-connector') as Connector;
  const textbox_formulaComputation = jobCard.querySelector('.text-box-line-group--formula-computation .text-box');
  const textP_formulaComputation_find = textbox_formulaComputation.querySelector('.text-box__paragraph--find');
  const textP_formulaComputation_max = textbox_formulaComputation.querySelector('.text-box__paragraph--max');
  const textP_formulaComputation_found = textbox_formulaComputation.querySelector('.text-box__paragraph--found');


  const computation1 = jobCard.querySelector('.computation--1');
  const computationResult1 = computation1.querySelector('.computation-result');
  const freeLine_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 wbfk-connector') as Connector;
  const textbox_computation1 = jobCard.querySelector('.text-box-line-group--computation--1 .text-box');
  const computationExpression1 = jobCard.querySelector('.computation--1 .computation-expression');
  const textP_computation1_intro = textbox_computation1.querySelector('.text-box__paragraph--intro');
  const textP_computation1_summary = textbox_computation1.querySelector('.text-box__paragraph--summary');
  const cAccessContainer = jobCard.querySelector('.c-access-container');
  const cAccess = jobCard.querySelector('.c-access');
  const cEntry = jobCard.querySelector('.c-entry');
  const freeLine_cAccess = jobCard.querySelector('.text-box-line-group--c-access wbfk-connector') as Connector;
  const textbox_cAccess = jobCard.querySelector('.text-box-line-group--c-access .text-box');
  const textP_cAccess_find = textbox_cAccess.querySelector('.text-box__paragraph--find');
  const textP_cAccess_found = textbox_cAccess.querySelector('.text-box__paragraph--found');
  const freeLine_toCBlock = jobCard.querySelector('.free-line--c-access-to-c-block') as Connector;
  const OPTExpressionContainer1 = jobCard.querySelector('.computation-expression--1 .OPT-expression-container');
  const OPTExpression1 = OPTExpressionContainer1.querySelector('.OPT-expression');
  const OPTResult1 = OPTExpressionContainer1.querySelector('.OPT-result');
  const freeLine_OPTExpression1 = jobCard.querySelector('.text-box-line-group--OPT-expression-1 wbfk-connector') as Connector;
  const textbox_OPTExpression1 = jobCard.querySelector('.text-box-line-group--OPT-expression-1 .text-box');
  const textP_OPTExpression1_find = textbox_OPTExpression1.querySelector('.text-box-line-group--OPT-expression-1 .text-box__paragraph--find');
  const textP_OPTExpression1_found = textbox_OPTExpression1.querySelector('.text-box-line-group--OPT-expression-1 .text-box__paragraph--found');


  const computation2 = jobCard.querySelector('.computation--2');
  const computationResult2 = computation2.querySelector('.computation-result');
  const OPTExpression2 = computation2.querySelector('.OPT-expression');
  const freeLine_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 wbfk-connector') as Connector;
  const textbox_computation2 = jobCard.querySelector('.text-box-line-group--computation--2 .text-box');
  const textP_computation2_intro = textbox_computation2.querySelector('.text-box__paragraph--intro');
  const textP_computation2_summary = textbox_computation2.querySelector('.text-box__paragraph--summary');
  const freeLine_OPTExpression2 = jobCard.querySelector('.text-box-line-group--OPT-expression-2 wbfk-connector') as Connector;
  const textbox_OPTExpression2 = jobCard.querySelector('.text-box-line-group--OPT-expression-2 .text-box');
  const nextSJNumExpression = computation2.querySelector('.next-SJ-num-expression');
  const nextSJNum = computation2.querySelector('.next-SJ-num');


  const jobCardChild1 = [...jobCard.querySelector('.job-card-children').children][0];
  const jobCardChild2 = [...jobCard.querySelector('.job-card-children').children][1];


  const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`)!;
  const MBlock_blank = MBlock.querySelector(`.array__array-entry--blank`);
  const MBlock_value = MBlock.querySelector(`.array__array-entry--value`);
  const cBlock = document.querySelector(`.array--c .array__array-block--${SJNum}`);


  const freeLine_upTree = jobCard.querySelector('.free-line--up-tree') as Connector;
  const freeLine_downTree = jobCard.querySelector('.free-line--down-tree') as Connector;
  const jobCardBullet = jobCard.querySelector('.job-card-bullet');


  /****************************************************** */
  // FADE IN JOB CARD AND M ACCESS
  /****************************************************** */
  {
    const animSequence = parentAnimSequence ?? new AnimSequence(null, {continuePrev: true});
    animSequence.setDescription('Fade in job card and M access');
    animSequence.setTag('start');
    animSequence.addManyBlocks([
      Entrance(jobCard, '~fade-in', [], {blocksNext: parentArrowDown ? false : true}), // TODO: blocksPrev being false wouldn't make the data-display border disappear in parallel
    ]);
    if (parentArrowDown && parentArrowSource) {
      animSequence.addManyBlocks([
        SetConnector(parentArrowDown, [parentArrowSource, 0, 1], [SJNumLabel, 0.5, -0.2]),
        DrawConnector(parentArrowDown, '~trace', ['from-A'], {blocksPrev: false}),
      ]);
    }
    if (aboveBullet) {
      const freeLine_bulletConnector = jobCard.querySelector('.free-line--bullet-connector') as Connector;
      animSequence.addManyBlocks([
        SetConnector(freeLine_bulletConnector, [aboveBullet, 0.5, 0.5], [jobCardBullet, 0.5, 0.5]),
        DrawConnector(freeLine_bulletConnector, '~trace', ['from-A']),
      ]);
    }
    animSequence.addManyBlocks([
      Entrance(MAccess, '~fade-in', []),
      Emphasis(MAccessContainer, '~highlight', [], {blocksNext: false, blocksPrev: false}),
      SetConnector(freeLine_MAccess, [MAccess, 0.5, -0.2], [textbox_MAccess, 0.5, 1]),
      DrawConnector(freeLine_MAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_MAccess, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // POINT TO M BLOCK ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point to M block array entry');
    // animSequence.addOneBlock([ 'line', freeLine_toMBlock, '~wipe', ['right'], MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ]);
    animSequence.addManyBlocks([
      SetConnector(freeLine_toMBlock,  [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(freeLine_toMBlock, '~trace', ['from-A']),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // FOCUS ON FORMULA CONTAINER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on formula container');
    animSequence.addManyBlocks([
      EraseConnector(freeLine_toMBlock, '~trace', ['from-B']),
      Exit(textbox_MAccess, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_MAccess, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(MAccessContainer, '~un-highlight', []),

      Entrance(arrowContainer, '~wipe', ['from-right']),
      Entrance(formulaComputation, '~fade-in', [], {blocksPrev: false}),
      Emphasis(formulaComputation, '~highlight', [], {blocksNext: false}),
      SetConnector(freeLine_formulaComputation, [formulaComputation, 0.1, 0.2], [textbox_formulaComputation, 0.5, 1]),
      DrawConnector(freeLine_formulaComputation, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_formulaComputation, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // FOCUS ON COMPUTATION 1
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on computation 1');
    animSequence.addManyBlocks([
      Exit(textbox_formulaComputation, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_formulaComputation, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(formulaComputation, '~un-highlight', [], {blocksPrev: false}),

      Emphasis(computationExpression1, '~highlight', [], {blocksNext: false}),
      SetConnector(freeLine_computation1, [computation1, 0.5, -0.2], [textbox_computation1, 0.5, 1]),
      DrawConnector(freeLine_computation1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation1, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // FOCUS ON C ACCESS
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on c access');
    animSequence.addManyBlocks([
      Exit(textbox_computation1, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_computation1, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(computationExpression1, '~un-highlight', [], {blocksNext: false, blocksPrev: false}),
  
      Emphasis(cAccessContainer, '~highlight', [], {blocksPrev: false}),
      SetConnector(freeLine_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(freeLine_cAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_cAccess, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // POINT TO C ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point to c array entry');
    animSequence.addManyBlocks([
      SetConnector(freeLine_toCBlock, [cAccessContainer, 0, 0.5], [cBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(freeLine_toCBlock, '~trace', ['from-A'], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // REVERSE ARROW AND REPLACE C ACCESS WITH VALUE
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Reverse arrow and replace c access with value');
    animSequence.addManyBlocks([
      EraseConnector(freeLine_toCBlock, '~fade-out', []),
      SetConnector(freeLine_toCBlock, [cBlock, 0.9, 0.5], [cAccessContainer, 0, 0.5]),
      DrawConnector(freeLine_toCBlock, '~trace', ['from-A']),
      // TODO: Address SetConnector update dilemma. The commented out code won't work, so I stopped writing it partway through
      // EraseConnector(freeLine_cAccess, '~fade-out', [], {duration: 0}),
      // SetConnector(freeLine_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1], {trackEndpoints: true}),
      // DrawConnector(freeLine_cAccess, '~fade-in', [], {duration: 0}),
      Exit(cAccess, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(cEntry, '~wipe', ['from-right'], {blocksNext: false}),

      // SetConnector(freeLine_cAccess, [cAccessContainer, 0.5, -0.2], [textbox_cAccess, 0.5, 1]),
      // DrawConnector(freeLine_cAccess, '~fade-in', [], {duration: 0}),
      Exit(textP_cAccess_find, '~fade-out', [], { duration: 250 }),
      Entrance(textP_cAccess_found, '~fade-in', [], { duration: 250 }),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // FOCUS ON OPT EXPRESSION 1 AS A WHOLE
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on OPT expression 1 as a whole');
    animSequence.addManyBlocks([
      // hide arrow for c block
      EraseConnector(freeLine_toCBlock, '~fade-out', []),
  
      // remove c access text
      Exit(textbox_cAccess, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_cAccess, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(cAccessContainer, '~un-highlight', [], {blocksPrev: false}),
  
      // enter OPT expression 1 text
      Emphasis(OPTExpressionContainer1, '~highlight', [], {blocksPrev: false, blocksNext: false}),
      SetConnector(freeLine_OPTExpression1, [OPTExpressionContainer1, 0.5, -0.2], [textbox_OPTExpression1, 0.5, 1]),
      DrawConnector(freeLine_OPTExpression1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_OPTExpression1, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }

  /****************************************************** */
  // RECURSION 1
  /****************************************************** */
  let sourceEl_OPT1, freeLine_fromSourceEl1; // pointing up from child
  {
    const animSeqPassDown = new AnimSequence();
    // add blocks to hide text about OPT expression before recursion
    animSeqPassDown.addManyBlocks([
      Exit(textbox_OPTExpression1, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_OPTExpression1, '~trace', ['from-A']),
    ]);
    let animSequence;
    // generate animation sequences for first child job/stub
    [animSequence, sourceEl_OPT1, freeLine_fromSourceEl1] = jobCardChild1.classList.contains('job-card--stub') ?
      animateJobStub(jobCardChild1, animSeqPassDown, freeLine_downTree, OPTExpressionContainer1, jobCardBullet) :
      animateJobCard(jobCardChild1, animSeqPassDown, freeLine_downTree, OPTExpressionContainer1, jobCardBullet);
    /****************************************************** */
    // REPLACE OPT1 EXPRESSION WITH ANSWER, CHANGE TEXT BOX TEXT
    /****************************************************** */
    animSequence.setDescription('Replace OPT1 expression with answer, change text box text');
    animSequence.setTag('OPT point 1');
    animSequence.addManyBlocks([
      SetConnector(freeLine_fromSourceEl1, [sourceEl_OPT1, 0.5, -0.2], [OPTExpressionContainer1, 0, 1.1]),
      DrawConnector(freeLine_fromSourceEl1, '~trace', ['from-A']),
      Exit(OPTExpression1, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(OPTResult1, '~wipe', ['from-right'], {blocksNext: false}),
      Exit(textP_OPTExpression1_find, '~fade-out', [], { duration: 250 }),
      Entrance(textP_OPTExpression1_found, '~fade-in', [], { duration: 250 }),
      SetConnector(freeLine_OPTExpression1, [OPTResult1, 0.5, -0.2], [textbox_OPTExpression1, 0.5, 1]),
      DrawConnector(freeLine_OPTExpression1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_OPTExpression1, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }
  

  /****************************************************** */
  // REMOVE ARROW COMING FROM CHILD, HIDE CURRENT TEXT; REPLACE COMPUTATION EXPRESSION WITH ANSWER; AND FOCUS ON WHOLE COMPUTATION1 (SWAP TEXT AS WELL)
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription(`Remove arrow coming from child, hide current text, replace computation expression with answer, and focus on whole computation1 (swap text as well)`);
    animSequence.addManyBlocks([
      EraseConnector(freeLine_fromSourceEl1, '~fade-out', [], {blocksNext: false}),
      Exit(textbox_OPTExpression1, '~fade-out', [], {blocksPrev: false, blocksNext: false}),
      EraseConnector(freeLine_OPTExpression1, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(OPTExpressionContainer1, '~un-highlight', [], {blocksPrev: false}),
  
      Exit(textP_computation1_intro, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(textP_computation1_summary, '~fade-in', [], {duration: 0, blocksPrev: false}),
      Exit(computationExpression1, '~wipe', ['from-right'],),
      Entrance(computationResult1, '~wipe', ['from-right'],),
      Emphasis(computationResult1, '~highlight', [], {blocksPrev: false, blocksNext: false}),
      SetConnector(freeLine_computation1, [computationResult1, 0.5, -0.2], [textbox_computation1, 0.5, 1]),
      DrawConnector(freeLine_computation1, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation1, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // FOCUS ON COMPUTATION 2
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on computation 2');
    animSequence.setTag('focus comp 2');
    animSequence.addManyBlocks([
      Exit(textbox_computation1, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_computation1, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(computationResult1, '~un-highlight', [], {blocksPrev: false}),

      Emphasis(computation2, '~highlight', [], {blocksNext: false}),
      SetConnector(freeLine_computation2, [computation2, 0.5, -0.2], [textbox_computation2, 0.5, 1]),
      DrawConnector(freeLine_computation2, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation2, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // REPLACE SUBTRACTION WITH RESULT; THEN FOCUS ON OPT EXPRESSION 2
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Replace subtraction with result; then focus on OPT expression 2');
    animSequence.addManyBlocks([
      Exit(textbox_computation2, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_computation2, '~trace', ['from-B'], {blocksNext: false}),
  
      Exit(nextSJNumExpression, '~wipe', ['from-right']),
      Entrance(nextSJNum, '~wipe', ['from-right']),
  
      SetConnector(freeLine_OPTExpression2, [computation2, 0.5, -0.2], [textbox_OPTExpression2, 0.5, 1]),
      DrawConnector(freeLine_OPTExpression2, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_OPTExpression2, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // RECURSION 2
  /****************************************************** */
  let sourceEl_OPT2, freeLine_fromSourceEl2; // pointing up from child
  {
    const animSeqPassDown = new AnimSequence();
    animSeqPassDown.addManyBlocks([
      Exit(textbox_OPTExpression2, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_OPTExpression2, '~trace', ['from-B']),
    ]);
    let animSequence;
    // create animation sequences for second child card/stub
    [animSequence, sourceEl_OPT2, freeLine_fromSourceEl2] = jobCardChild2.classList.contains('job-card--stub') ?
      animateJobStub(jobCardChild2, animSeqPassDown, freeLine_downTree, OPTExpression2, jobCardChild1.querySelector('.job-card-bullet')) :
      animateJobCard(jobCardChild2, animSeqPassDown, freeLine_downTree, OPTExpression2, jobCardChild1.querySelector('.job-card-bullet'));
    /****************************************************** */
    // REPLACE OPT2 EXPRESSION WITH ANSWER, HIDE OLD TEXT, AND ADD COMPUTATION 2 TEXT WITH SWAPPED TEXT
    /****************************************************** */
    animSequence.setDescription('Replace OPT2 expression with answer, hide old text, and add computation 2 text with swapped text');
    animSequence.addManyBlocks([
      SetConnector(freeLine_fromSourceEl2, [sourceEl_OPT2, 0.5, -0.2], [computation2, 0, 1.1]),
      DrawConnector(freeLine_fromSourceEl2, '~trace', ['from-A']),

      Exit(textP_computation2_intro, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(textP_computation2_summary, '~fade-in', [], {duration: 0, blocksPrev: false}),

      Emphasis(computation2, '~un-highlight', [], {blocksNext: false}),
      Exit(OPTExpression2, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(computationResult2, '~wipe', ['from-right'], {blocksNext: false}),
      Emphasis(computationResult2, '~highlight', [], {blocksPrev: false}),

      SetConnector(freeLine_computation2, [computation2, 0.5, -0.2], [textbox_computation2, 0.5, 1]),
      DrawConnector(freeLine_computation2, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_computation2, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }
  

  /****************************************************** */
  // FOCUS ON WHOLE FORMULA CONTAINER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Focus on whole formula container');
    animSequence.addManyBlocks([
      EraseConnector(freeLine_fromSourceEl2, '~fade-out', []),
      Exit(textbox_computation2, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_computation2, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(computationResult2, '~un-highlight', [], {blocksPrev: false}),

      
      Exit(textP_formulaComputation_find, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(textP_formulaComputation_max, '~fade-in', [], {duration: 0, blocksPrev: false}),
      Emphasis(formulaContainer, '~highlight', [], {blocksNext: false}),
      SetConnector(freeLine_formulaComputation, [formulaContainer, 0.5, 0], [textbox_formulaComputation, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(freeLine_formulaComputation, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_formulaComputation, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */  
  // REPLACE FORMULA CONTAINER CONTENTS WITH FINAL ANSWER
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setTag('replace formula container contents');
    animSequence.setDescription('Replace formula container contents with final answer');
    animSequence.addManyBlocks([
      // TODO: Address
      // [ 'line', freeLine_formulaComputation, 'updateEndpoints', formulaContainer, [0.5, 0], null, [0.5, 1] ],

      Exit(formulaComputation, '~wipe', ['from-right'], {blocksPrev: false}),
      Entrance(formulaResult, '~wipe', ['from-right'], {blocksNext: false}),

      // [ 'line', freeLine_formulaComputation, 'updateEndpoints', formulaContainer, [0.5, 0], null, [0.5, 1] ],
  
      Exit(textP_formulaComputation_max, '~fade-out', [], { duration: 250 }),
      Entrance(textP_formulaComputation_found, '~fade-in', [], { duration: 250 }),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // SHOW ONLY M CONTAINER, REPLACE M ACCESS WITH FINAL COMPUTED OPTIMAL VALUE, AND UPDATE M ARRAY BLOCK
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Show only M container, replace M access with final computed optimal value, and update M array block');
    animSequence.setTag('found max');
    animSequence.addManyBlocks([
      // hide formula container
      Exit(textbox_formulaComputation, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_formulaComputation, '~trace', ['from-B'], {blocksNext: false}),
      Emphasis(formulaContainer, '~un-highlight', [], {blocksNext: false}),
      Exit(formulaContainer, '~wipe', ['from-right']),
      Exit(arrowContainer, '~wipe', ['from-right']),
  
      // Visually update M access to final answer
      Exit(MAccess, '~wipe', ['from-right']),
      Entrance(MEntry, '~wipe', ['from-right']),
      Emphasis(MAccessContainer, '~highlight', []),
  
      // Visually update M array entry
      SetConnector(freeLine_toMBlock, [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(freeLine_toMBlock, '~trace', ['from-right']),
      Exit(MBlock_blank, '~fade-out', []),
      Entrance(MBlock_value, '~fade-in', []),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // REMOVE ARROW POINTING FROM M BLOCK AND SHOW FINAL TEXT BOX
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Remove arrow pointing from M block and show final text box');
    animSequence.addManyBlocks([
      // Add last text box
      Exit(textP_MAccess_intro, '~fade-out', [], {duration: 0, blocksNext: false}),
      Entrance(textP_MAccess_solved, '~fade-in', [], {duration: 0, blocksPrev: false}),
      EraseConnector(freeLine_toMBlock, '~trace', ['from-A']),
      SetConnector(freeLine_MAccess, [MAccessContainer, 0.5, -0.2], [textbox_MAccess, 0.5, 1], {trackEndpoints: true}),
      DrawConnector(freeLine_MAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_MAccess, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // IF THIS IS A CHILD, ADD BLOCKS FOR HIDING PARENT ARROW BEFORE GOING BACK UP RECURSION TREE
  /****************************************************** */
  if (parentArrowDown) {
    // just for hiding the last text box before moving back up the tree
    const animSequence = new AnimSequence();
    animSequence.setTag('finish a main card');
    animSequence.addManyBlocks([
      Exit(textbox_MAccess, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_MAccess, '~trace', ['from-B']),
      EraseConnector(parentArrowDown, '~fade-out', [], {blocksNext: false}),
      Emphasis(MAccessContainer, '~un-highlight', [], {blocksPrev: false}),
    ]);

    return [animSequence, MAccessContainer, freeLine_upTree];
  }
};

// terminal function that creates the animation sequences for job stubs (which are leaves of the job card tree)
function animateJobStub(jobCard, parentAnimSequence, parentArrowDown, parentArrowSource, aboveBullet) {
  const SJNum = Number.parseInt(jobCard.dataset.sjnum);
  const jobCardContent = jobCard.querySelector('.job-card-content');
  const SJNumLabel = jobCardContent.querySelector('.job-card-SJ-num-label');
  const MAccessContainer = jobCard.querySelector('.M-access-container');
  const MAccess = jobCard.querySelector('.M-access');
  const MEntry = jobCard.querySelector('.M-entry');
  const freeLine_MAccess = jobCard.querySelector('.text-box-line-group--M-access wbfk-connector');
  const textbox_MAccess = jobCard.querySelector('.text-box-line-group--M-access .text-box');
  const textbox_MAccess_p1 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--1');
  const textbox_MAccess_p2 = jobCard.querySelector('.text-box-line-group--M-access .text-box .text-box__paragraph--2');
  const freeLine_toMBlock = jobCard.querySelector('.free-line--M-access-to-M-block');


  const MBlock = document.querySelector(`.array--M .array__array-block--${SJNum}`);

  
  const freeLine_bulletConnector = jobCard.querySelector('.free-line--bullet-connector');
  const freeLine_upTree = jobCard.querySelector('.free-line--up-tree');
  const jobCardBullet = jobCard.querySelector('.job-card-bullet');


  /****************************************************** */
  // FADE IN JOB STUB AND M ACCESS
  /****************************************************** */
  {
    const animSequence = parentAnimSequence;
    animSequence.addManyBlocks([
      Entrance(jobCard, '~fade-in', [], {blocksNext: false}),
    ]);
    animSequence.addManyBlocks([
      SetConnector(freeLine_bulletConnector, [aboveBullet, 0.5, 0.5], [jobCardBullet, 0.5, 0.5]),
      DrawConnector(freeLine_bulletConnector, '~trace', ['from-A']),
    ]);
    animSequence.setDescription('Fade in job stub and M access');
    animSequence.addManyBlocks([
      SetConnector(parentArrowDown, [parentArrowSource, 0, 1], [SJNumLabel, 0.5, -0.2]),
      DrawConnector(parentArrowDown, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(MAccess, '~fade-in', []),
      Emphasis(MAccessContainer, '~highlight', [], {blocksNext: false, blocksPrev: false}),
      SetConnector(freeLine_MAccess, [MAccessContainer, 0.5, -0.2], [textbox_MAccess, 0.5, 1]),
      DrawConnector(freeLine_MAccess, '~trace', ['from-A'], {blocksPrev: false}),
      Entrance(textbox_MAccess, '~fade-in', [], {blocksPrev: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // POINT TO M BLOCK ARRAY ENTRY
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point to M block array entry');
    animSequence.addManyBlocks([
      SetConnector(freeLine_toMBlock, [MAccessContainer, 0, 0.5], [MBlock, 0.9, 0.5], {trackEndpoints: true}),
      DrawConnector(freeLine_toMBlock, '~trace', ['from-A']),
    ]);

    animTimeline.addOneSequence(animSequence);
  }
  

  /****************************************************** */
  // POINT BACK TO M ACCESS FROM M BLOCK
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.setDescription('Point back to M access from M block');
    animSequence.addManyBlocks([
      EraseConnector(freeLine_toMBlock, '~fade-out', []),
      SetConnector(freeLine_toMBlock, [MBlock, 0.9, 0.5], [MAccessContainer, 0, 0.5]),
      DrawConnector(freeLine_toMBlock, '~trace', ['from-A']),
      // [ 'line', freeLine_toMBlock, '~fade-out', [], MAccessContainer, [0, 0.5], MBlock, [0.9, 0.5], {lineOptions: {trackEndpoints: true}} ],
      // [ 'line', freeLine_toMBlock, '~wipe', ['left'], MBlock, [0.9, 0.5], MAccessContainer, [0, 0.5], {lineOptions: {trackEndpoints: true}} ],
      Exit(MAccess, '~wipe', ['from-right']),
      Entrance(MEntry, '~wipe', ['from-right']),
      Exit(textbox_MAccess_p1, '~fade-out', [], {duration: 250, blocksNext: false}),
      Entrance(textbox_MAccess_p2, '~fade-in', [], {duration: 250, blocksNext: false}),
    ]);

    animTimeline.addOneSequence(animSequence);
  }


  /****************************************************** */
  // RETURN BLOCK THAT INITIALLY HIDES REMAINING STUFF AND POINTS TO PARENT
  /****************************************************** */
  {
    const animSequence = new AnimSequence();
    animSequence.addManyBlocks([
      EraseConnector(freeLine_toMBlock, '~fade-out', [], {blocksNext: false}),
      EraseConnector(freeLine_MAccess, '~trace', ['from-B'], {blocksPrev: false, blocksNext: false}),
      Exit(textbox_MAccess, '~fade-out', [], {blocksPrev: false}),
      EraseConnector(parentArrowDown, '~fade-out', [], {blocksNext: false}),
      Emphasis(MAccessContainer, '~un-highlight', [], {blocksPrev: false}),
    ]);
  
    return [animSequence, MAccessContainer, freeLine_upTree];
  }
};
