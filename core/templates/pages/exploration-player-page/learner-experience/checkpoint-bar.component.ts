import { Component, Input, OnInit } from '@angular/core';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ConversationFlowService } from '../services/conversation-flow.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { PlayerPositionService } from '../services/player-position.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

const CHECKPOINT_STATUS_INCOMPLETE = 'incomplete';
const CHECKPOINT_STATUS_COMPLETED = 'completed';
const CHECKPOINT_STATUS_IN_PROGRESS = 'in-progress';

@Component({
  selector: 'oppia-checkpoint-bar',
  templateUrl: './checkpoint-bar.component.html',
  styleUrls: ['./checkpoint-bar.component.css']
})

export class CheckpointBarComponent implements OnInit {
  checkpointStatusArray!: string[];
  @Input() showClickAction: boolean = false;

  checkpointCount!: number;
  completedCheckpointsCount: number = 0;



  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private conversationFlowService: ConversationFlowService,
    private ngbActiveModal: NgbActiveModal,
    private playerTranscriptService: PlayerTranscriptService,
    private explorationEngineService: ExplorationEngineService,
    private playerPositionService: PlayerPositionService
  ) {}

  ngOnInit(): void {
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
      this.checkpointStatusArray[this.completedCheckpointsCount] =
        CHECKPOINT_STATUS_IN_PROGRESS;
    }
    for (
      let i = this.completedCheckpointsCount + 1;
      i < this.checkpointCount;
      i++
    ) {
      this.checkpointStatusArray[i] = CHECKPOINT_STATUS_INCOMPLETE;
    }
  }

  getCheckpointCount(): void {
    this.conversationFlowService.getCheckpointCount().then((checkpointCount: number) => {
      this.checkpointCount = checkpointCount;
    });
  }

  getCompletedProgressBarWidth(): number {
    this.getCheckpointCount();
    this.completedCheckpointsCount = this.conversationFlowService.getCompletedCheckpointsCount(
      this.checkpointCount
    );
    if (this.completedCheckpointsCount === 0) {
      return 0;
    }
    const spaceBetweenEachNode = 100 / (this.checkpointCount - 1);
    return (
      (this.completedCheckpointsCount - 1) * spaceBetweenEachNode +
      spaceBetweenEachNode / 2
    );
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

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  /**
 * If the checkpoint is completed, this function returns the user to the checkpoint.
 *
 * @param {number} checkpointNumber - The number of the checkpoint to return to.
 * @returns {void} This function does not return a value. It changes the displayed card if the checkpoint is completed.
 */
  returnToCheckpointIfCompleted(checkpointNumber: number): void {
    const checkpointCardIndexes = this.getCheckpointCardIndexes();
    const cardIndex = checkpointCardIndexes[checkpointNumber];

    if (cardIndex === undefined) {
      console.error('No card index associated with this checkpoint.');
    }
    if (
      this.checkpointStatusArray[checkpointNumber] !==
      CHECKPOINT_STATUS_COMPLETED
    ) {
      return;
    } else {
      this.playerPositionService.setDisplayedCardIndex(cardIndex);
      this.playerPositionService.onActiveCardChanged.emit();
      this.ngbActiveModal.close();
    }
  }

    /**
   * Retrieves the indexes of cards that are marked as checkpoints.
   *
   * @returns {number[]} An array of indexes of cards. Each index corresponds to a card that is a checkpoint.
   */
    getCheckpointCardIndexes(): number[] {
      const checkpointCardIndexes: number[] = [];
      const numberOfCards = this.playerTranscriptService.getNumCards();

      for (let i = 0; i < numberOfCards; i++) {
        const stateName = this.playerTranscriptService.getCard(i).getStateName();
        const correspondingState =
          this.explorationEngineService.getStateFromStateName(stateName);
        if (correspondingState.cardIsCheckpoint) {
          checkpointCardIndexes.push(i);
        }
      }
      return checkpointCardIndexes;
    }
}
