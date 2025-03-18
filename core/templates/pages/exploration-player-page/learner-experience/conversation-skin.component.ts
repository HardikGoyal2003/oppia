// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Component for the conversation skin.
 */

import {Subscription} from 'rxjs';
import {StateCard} from 'domain/state_card/state-card.model';
import {ChangeDetectorRef, Component, Input} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';
import {ContextService} from 'services/context.service';
import {CurrentInteractionService} from '../services/current-interaction.service';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {ExplorationPlayerStateService} from '../services/exploration-player-state.service';
import {GuestCollectionProgressService} from 'domain/collection/guest-collection-progress.service';
import {HintsAndSolutionManagerService} from '../services/hints-and-solution-manager.service';
import {ImagePreloaderService} from '../services/image-preloader.service';
import {LearnerParamsService} from '../services/learner-params.service';
import {LoaderService} from 'services/loader.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {QuestionPlayerEngineService} from '../services/question-player-engine.service';
import {StatsReportingService} from '../services/stats-reporting.service';
import {UrlService} from 'services/contextual/url.service';
import {UserService} from 'services/user.service';
import {QuestionPlayerStateService} from 'components/question-directives/question-player/services/question-player-state.service';
import {InteractionRulesService} from '../services/answer-classification.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {AppConstants} from 'app.constants';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ConversationFlowService} from '../services/conversation-flow.service';
import './conversation-skin.component.css';
import {ConceptCardManagerService} from '../services/concept-card-manager.service';

@Component({
  selector: 'oppia-conversation-skin',
  templateUrl: './conversation-skin.component.html',
  styleUrls: ['./conversation-skin.component.css'],
})
export class ConversationSkinComponent {
  @Input() questionPlayerConfig;
  @Input() diagnosticTestTopicTrackerModel;
  directiveSubscriptions = new Subscription();

  _editorPreviewMode;

  CONTINUE_BUTTON_FOCUS_LABEL =
    ExplorationPlayerConstants.CONTINUE_BUTTON_FOCUS_LABEL;

  isLoggedIn: boolean;
  voiceoversAreLoaded: boolean = false;
  collectionId: string;
  explorationId: string;
  isInPreviewMode: boolean;
  isIframed: boolean;
  alertMessage = {};
  OPPIA_AVATAR_IMAGE_URL: string;
  displayedCard: StateCard;
  DEFAULT_TWITTER_SHARE_MESSAGE_PLAYER =
    AppConstants.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR;
  pidInUrl: string;
  submitButtonIsDisabled = true;
  isLearnerReallyStuck: boolean = false;

  // The fields are used to customize the component for the diagnostic player,
  // question player, and exploration player page.
  feedbackIsEnabled: boolean = true;
  learnerCanOnlyAttemptQuestionOnce: boolean = false;
  inputOutputHistoryIsShown: boolean = true;
  navigationThroughCardHistoryIsEnabled: boolean = true;
  checkpointCelebrationModalIsEnabled: boolean = true;
  skipButtonIsShown: boolean = false;

  constructor(
    private windowRef: WindowRef,
    private changeDetectorRef: ChangeDetectorRef,
    private contextService: ContextService,
    private currentInteractionService: CurrentInteractionService,
    private explorationEngineService: ExplorationEngineService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private guestCollectionProgressService: GuestCollectionProgressService,
    private hintsAndSolutionManagerService: HintsAndSolutionManagerService,
    private conceptCardManagerService: ConceptCardManagerService,
    private imagePreloaderService: ImagePreloaderService,
    private learnerParamsService: LearnerParamsService,
    private loaderService: LoaderService,
    private playerPositionService: PlayerPositionService,
    private playerTranscriptService: PlayerTranscriptService,
    private questionPlayerEngineService: QuestionPlayerEngineService,
    private questionPlayerStateService: QuestionPlayerStateService,
    private statsReportingService: StatsReportingService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private userService: UserService,
    private platformFeatureService: PlatformFeatureService,
    private conversationFlowService: ConversationFlowService,
  ) {}


  ngOnInit(): void {
    this.conversationFlowService.initializeService();
    this._editorPreviewMode = this.contextService.isInExplorationEditorPage();
    this.collectionId = this.urlService.getCollectionIdFromExplorationUrl();
    this.pidInUrl = this.urlService.getPidFromUrl();

    if (this.diagnosticTestTopicTrackerModel) {
      this.feedbackIsEnabled = false;
      this.learnerCanOnlyAttemptQuestionOnce = true;
      this.inputOutputHistoryIsShown = false;
      this.navigationThroughCardHistoryIsEnabled = false;
      this.checkpointCelebrationModalIsEnabled = false;
      this.skipButtonIsShown = true;
      this.conversationFlowService.updateCorrectnessFooterIsShown(false);
    }

    if (!this.contextService.isInExplorationPlayerPage()) {
      this.checkpointCelebrationModalIsEnabled = false;
    }

    this.explorationId = this.explorationEngineService.getExplorationId();
    this.isInPreviewMode = this.explorationEngineService.isInPreviewMode();
    this.isIframed = this.urlService.isIframed();
    this.loaderService.showLoadingScreen('Loading');

    this.OPPIA_AVATAR_IMAGE_URL =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );

    if (this.explorationPlayerStateService.isInQuestionPlayerMode()) {
      this.directiveSubscriptions.add(
        this.hintsAndSolutionManagerService.onHintConsumed.subscribe(() => {
          this.questionPlayerStateService.hintUsed(
            this.questionPlayerEngineService.getCurrentQuestion()
          );
        })
      );

      this.directiveSubscriptions.add(
        this.hintsAndSolutionManagerService.onSolutionViewedEventEmitter.subscribe(
          () => {
            this.questionPlayerStateService.solutionViewed(
              this.questionPlayerEngineService.getCurrentQuestion()
            );
          }
        )
      );
    }

    this.directiveSubscriptions.add(
      this.explorationPlayerStateService.onShowProgressModal.subscribe(() => {
        this.conversationFlowService.updateHasFullyLoaded(true);
      })
    );

    this.directiveSubscriptions.add(
      this.playerPositionService.onNewCardOpened.subscribe(
        (newCard: StateCard) => {
          this.conversationFlowService.updateSolutionForState(newCard.getSolution());
          this.conversationFlowService.updateNumberOfIncorrectSubmissions(0);
          this.conversationFlowService.updateNextCardIfStuck(null);
          this.conversationFlowService.updateContinueToReviseStateButtonIsVisible(false);
          this.conversationFlowService.triggerIfLearnerStuckAction();
        }
      )
    );

    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onLearnerReallyStuck.subscribe(() => {
        this.conversationFlowService.triggerIfLearnerStuckActionDirectly();
      })
    );

    this.directiveSubscriptions.add(
      this.hintsAndSolutionManagerService.onHintsExhausted.subscribe(() => {
        this.conversationFlowService.triggerIfLearnerStuckAction();
      })
    );

    this.directiveSubscriptions.add(
      this.conceptCardManagerService.onLearnerGetsReallyStuck.subscribe(() => {
        this.isLearnerReallyStuck = true;
        this.conversationFlowService.triggerIfLearnerStuckActionDirectly();
      })
    );

    this.directiveSubscriptions.add(
      this.explorationPlayerStateService.onPlayerStateChange.subscribe(
        newStateName => {
          if (!newStateName) {
            return;
          }
          // To restart the preloader for the new state if required.
          if (!this._editorPreviewMode) {
            this.imagePreloaderService.onStateChange(newStateName);
          }
          // Ensure the transition to a terminal state properly logs
          // the end of the exploration.
          if (!this._editorPreviewMode && this.conversationFlowService.getNextCard().isTerminal()) {
            const currentEngineService =
              this.explorationPlayerStateService.getCurrentEngineService();
            this.statsReportingService.recordExplorationCompleted(
              newStateName,
              this.learnerParamsService.getAllParams(),
              String(
                this.conversationFlowService.getCompletedChaptersCount() &&
                this.conversationFlowService.getCompletedChaptersCount() + 1
              ),
              String(this.playerTranscriptService.getNumCards()),
              currentEngineService.getLanguageCode()
            );

            // If the user is a guest, has completed this exploration
            // within the context of a collection, and the collection is
            // allowlisted, record their temporary progress.

            if (
              this.conversationFlowService.doesCollectionAllowsGuestProgress(this.collectionId) &&
              !this.isLoggedIn
            ) {
              this.guestCollectionProgressService.recordExplorationCompletedInCollection(
                this.collectionId,
                this.explorationId
              );
            }

            // For single state explorations, when the exploration
            // reachesthe terminal state and explorationActuallyStarted
            // is false, record exploration actual start event.
            if (!this.conversationFlowService.getExplorationActuallyStarted()) {
              this.statsReportingService.recordExplorationActuallyStarted(
                newStateName
              );
              this.conversationFlowService.updateExplorationActuallyStarted(true);
            }
          }
        }
      )
    );

    // Moved the following code to then section as isLoggedIn
    // variable needs to be defined before the following code is executed.
    this.userService.getUserInfoAsync().then(async userInfo => {
      this.isLoggedIn = userInfo.isLoggedIn();

      this.windowRef.nativeWindow.addEventListener('beforeunload', e => {
        this.conversationFlowService.handleBeforeUnload(e);
      });

      await this.conversationFlowService.syncProgressOnLogin();
      this.conversationFlowService.adjustPageHeightOnresize();

      this.currentInteractionService.setOnSubmitFn(
        this.conversationFlowService.submitAnswer.bind(this.conversationFlowService)
      );

      this.conversationFlowService.updateStartCardChangeAnimation(false);
      this.conversationFlowService.initializePage(this.questionPlayerConfig, this.diagnosticTestTopicTrackerModel);
      this.conversationFlowService.initializeCollectionAndChapterData();
      this.conversationFlowService.initializeCheckpointProgress();
    });
  }

  isSubmitButtonDisabled(): boolean {
    return this.conversationFlowService.isSubmitButtonDisabled();
  }

  showUpcomingCard(): void {
    this.conversationFlowService.showUpcomingCard();
  }

  getCollectionSummary(): string[] | null {
    return this.conversationFlowService.getCollectionSummary();
  }

  getdisplayedCard(): StateCard {
    return this.conversationFlowService.getdisplayedCard();
  }

  ngAfterViewChecked(): void {
    let submitButtonIsDisabled = this.isSubmitButtonDisabled();
    if (submitButtonIsDisabled !== this.submitButtonIsDisabled) {
      this.submitButtonIsDisabled = submitButtonIsDisabled;
      this.changeDetectorRef.detectChanges();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  alwaysAskLearnerForAnswerDetails(): boolean {
    return this.conversationFlowService.alwaysAskLearnerForAnswerDetails();
  }

  getCanAskLearnerForAnswerInfo(): boolean {
    return this.conversationFlowService.getCanAskLearnerForAnswerInfo();
  }

  isCorrectnessFooterEnabled(): boolean {
    return this.conversationFlowService.isCorrectnessFooterEnabled();
  }

  getInStoryMode(): boolean {
    return this.conversationFlowService.getInStoryMode();
  }

  isLearnAgainButton(): boolean {
    return this.conversationFlowService.isLearnAgainButton();
  }

  getCompletedChaptersCount(): number | undefined {
    return this.conversationFlowService.getCompletedChaptersCount();
  }

  getStaticImageUrl(imagePath: string): string {
    return this.conversationFlowService.getStaticImageUrl(imagePath);
  }

  getExplorationLink(): string {
    return this.conversationFlowService.getExplorationLink();
  }

  isEndChapterCelebrationFeatureEnabled(): boolean {
    return this.platformFeatureService.status.EndChapterCelebration.isEnabled;
  }

  getChapterIsCompletedForTheFirstTime(): boolean {
    return this.conversationFlowService.getChapterIsCompletedForTheFirstTime();
  }

  isOnTerminalCard(): boolean {
    return this.conversationFlowService.isOnTerminalCard();
  }

  isCurrentSupplementalCardNonempty(): boolean {
    return this.conversationFlowService.isSupplementalCardNonempty(
      this.conversationFlowService.getdisplayedCard()
    );
  }

  isSupplementalNavShown(): boolean {
    return this.conversationFlowService.isSupplementalNavShown();
  }

  isCurrentCardAtEndOfTranscript(): boolean {
    return this.conversationFlowService.isCurrentCardAtEndOfTranscript();
  }

  triggerRedirectionToStuckState(): void {
    // Redirect the learner.
    this.conversationFlowService.triggerRedirectionToStuckState();
  }

  getShowInteraction(): boolean {
    return this.conversationFlowService.getShowInteraction();
  }

  skipCurrentQuestion(): void {
    this.conversationFlowService.skipCurrentQuestion();
  }

  getHasFullyLoaded(): boolean {
    return this.conversationFlowService.getHasFullyLoaded();
  }

  submitAnswer(
    answer: string,
    interactionRulesService: InteractionRulesService
  ): void {
    this.conversationFlowService.submitAnswer(answer, interactionRulesService);
  }

  getIsRefresherExploration(): boolean {
    return this.conversationFlowService.getIsRefresherExploration();
  }

  getStartCardChangeAnimation(): boolean {
    return this.conversationFlowService.getStartCardChangeAnimation();
  }

  getRecommendedExplorationSummaries(): LearnerExplorationSummary[] {
    return this.conversationFlowService.getRecommendedExplorationSummaries();
  }

  submitAnswerFromProgressNav(): void {
    this.conversationFlowService.submitAnswerFromProgressNav();
  }

  getAnswerIsBeingProcessed(): boolean {
    return this.conversationFlowService.getAnswerIsBeingProcessed();
  }

  getParentExplorationIds(): string[] {
    return this.conversationFlowService.getParentExplorationIds();
  }

  getRecommendedExpTitleTranslationKey(explorationId: string): string {
    return this.conversationFlowService.getRecommendedExpTitleTranslationKey(
      explorationId
    );
  }

  isHackyExpTitleTranslationDisplayed(explorationId: string): boolean {
    return this.conversationFlowService.isHackyExpTitleTranslationDisplayed(
      explorationId
    );
  }

  isDisplayedCardCompletedInPrevSession(): boolean {
    return this.conversationFlowService.isDisplayedCardCompletedInPrevSession();
  }

  isProgressClearanceMessageShown(): boolean {
    return this.conversationFlowService.getProgressClearanceMessageIsShowed();
  }

  // Returns whether the screen is wide enough to fit two
  // cards (e.g., the tutor and supplemental cards) side-by-side.
  canWindowShowTwoCards(): boolean {
    return this.conversationFlowService.canWindowShowTwoCards();
  }

  changeCard(index: number): void {
    this.conversationFlowService.changeCard(index);
  }

  getIsAnimatingToTwoCards(): boolean {
    return this.conversationFlowService.getIsAnimatingToTwoCards();
  }

  getIsAnimatingToOneCard(): boolean {
    return this.conversationFlowService.getIsAnimatingToOneCard();
  }
}
