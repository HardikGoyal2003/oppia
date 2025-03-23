import { Component, OnInit } from '@angular/core';
import './checkpoint-bar.component.css';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { PlayerPositionService } from '../services/player-position.service';
import { Subscription } from 'rxjs';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

@Component({
  selector: 'oppia-checkpoint-bar',
  templateUrl: './checkpoint-bar.component.html',
  styleUrls: ['./checkpoint-bar.component.css']
})

export class CheckpointBarComponent implements OnInit {
  explorationId: string;
  expStates!: StateObjectsBackendDict;
  checkpointCount: number = 0;
  expEnded: boolean = false;
  directiveSubscriptions = new Subscription();
  completedCheckpointsCount!: number;
  checkpointStatusArray: string[];

  constructor(
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private explorationEngineService: ExplorationEngineService,
    private playerTranscriptService: PlayerTranscriptService,
    private playerPositionService: PlayerPositionService,
  ) {}

  ngOnInit(): void {
    this.explorationId = this.explorationEngineService.getExplorationId();

    this.getCheckpointCount().then(() => {
      this.updateLessonProgressBar();
    });

    this.directiveSubscriptions.add(
      this.playerPositionService.onActiveCardChanged.subscribe(
        () => {
          this.updateLessonProgressBar();
        }
      )
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        () => {
          this.updateLessonProgressBar();
        }
      )
    );
  }

  getCompletedProgressBarWidth(): number {
    if (this.completedCheckpointsCount === 0) {
      return 0;
    }
    const spaceBetweenEachNode = 100 / (this.checkpointCount - 1);
    return (
      ((this.completedCheckpointsCount - 1) * spaceBetweenEachNode) +
      (spaceBetweenEachNode / 2));
  }

  getProgressPercentage(): string {
  if (this.completedCheckpointsCount === this.checkpointCount) {
      return '100';
    }
  if (this.completedCheckpointsCount === 0) {
      return '0';
  }
  const progressPercentage = Math.floor(
    (this.completedCheckpointsCount / this.checkpointCount) * 100
  );
  return progressPercentage.toString();
  }

  getMostRecentlyReachedCheckpointIndex(): number {
    let checkpointIndex = 0;
    let numberOfCards = this.playerTranscriptService.getNumCards();
    for (let i = 0; i < numberOfCards; i++) {
      let stateName = this.playerTranscriptService.getCard(i).getStateName();
      let correspondingState = this.explorationEngineService.
        getStateFromStateName(stateName);
      if (correspondingState.cardIsCheckpoint) {
        checkpointIndex++;
      }
    }
    return checkpointIndex;
  }

  updateLessonProgressBar(): void {
    if (!this.expEnded) {
      const mostRecentlyReachedCheckpointIndex = (
        this.getMostRecentlyReachedCheckpointIndex()
      );
      this.completedCheckpointsCount = mostRecentlyReachedCheckpointIndex - 1;

      let displayedCardIndex = (
        this.playerPositionService.getDisplayedCardIndex()
      );
      if (displayedCardIndex > 0) {
        let state = this.explorationEngineService.getState();
        let stateCard = this.explorationEngineService.getStateCardByName(
          state.name);
        if (stateCard.isTerminal()) {
          this.completedCheckpointsCount += 1;
          this.expEnded = true;
        }
      }
    }
    // This array is used to keep track of the status of each checkpoint,
    // i.e. whether it is completed, in-progress, or yet-to-be-completed by the
    // learner. This information is then used to display the progress bar
    // in the lesson info card.
    this.checkpointStatusArray = new Array(this.checkpointCount);
    for (let i = 0; i < this.completedCheckpointsCount; i++) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_COMPLETED;
    }
    // If not all checkpoints are completed, then the checkpoint immediately
    // following the last completed checkpoint is labeled 'in-progress'.
    if (this.checkpointCount > this.completedCheckpointsCount) {
      this.checkpointStatusArray[this.completedCheckpointsCount] = (
        CHECKPOINT_STATUS_IN_PROGRESS);
    }
    for (
      let i = this.completedCheckpointsCount + 1;
      i < this.checkpointCount;
      i++
    ) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  async getCheckpointCount(): Promise<void> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(this.explorationId, null).then(
        (response: FetchExplorationBackendResponse) => {
          this.expStates = response.exploration.states;
          let count = 0;
          for (let [, value] of Object.entries(this.expStates)) {
            if (value.card_is_checkpoint) {
              count++;
            }
          }
          this.checkpointCount = count;
        });
  }
}
