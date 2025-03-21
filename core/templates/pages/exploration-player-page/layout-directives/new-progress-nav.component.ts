import { Component } from '@angular/core';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { PlayerPositionService } from '../services/player-position.service';

@Component({
  selector: 'oppia-new-progress-nav',
  templateUrl: './new-progress-nav.component.html',
  styleUrls: ['./new-progress-nav.component.scss']
})
export class NewProgressNavComponent {
  hasPrevious!: boolean;
  transcriptLength: number = 0;
  displayedCardIndex!: number;
  hasNext!: boolean;
  interactionIsInline: boolean = true;

  constructor(
    private playerTranscriptService: PlayerTranscriptService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private playerPositionService: PlayerPositionService,
  ) { }

  // ngOnInit(): void {
  // }

  // updateDisplayedCardInfo(): void {
  //   this.transcriptLength = this.playerTranscriptService.getNumCards();
  //   this.displayedCardIndex = (
  //     this.playerPositionService.getDisplayedCardIndex());
  //   this.hasPrevious = this.displayedCardIndex > 0;
  //   this.hasNext = !this.playerTranscriptService.isLastCard(
  //     this.displayedCardIndex);

  //   // this.conceptCardIsBeingShown = (
  //   //   this.displayedCard.getStateName() === null &&
  //   //     !this.explorationPlayerStateService.isPresentingIsolatedQuestions()
  //   // );

  //   // if (!this.conceptCardIsBeingShown) {
  //     this.interactionIsInline = this.displayedCard.isInteractionInline();
  //     this.interactionCustomizationArgs = this.displayedCard
  //       .getInteractionCustomizationArgs();
  //     this.interactionId = this.displayedCard.getInteractionId();

  //     if (this.interactionId === 'Continue') {
  //       // To ensure that focus is added after all functions
  //       // in main thread are completely executed.
  //       setTimeout(() => {
  //         this.focusManagerService.setFocusWithoutScroll('continue-btn');
  //       }, 0);
  //     }
  //   // }
  //   this.helpCardHasContinueButton = false;
  //   this.newCardStateName = this.displayedCard.getStateName();
  // }

}
