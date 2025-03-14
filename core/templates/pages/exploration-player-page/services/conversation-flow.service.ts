// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to manage the conversation flow of the exploration player,
 * controlling behaviours such as adding cards to the stack, or submitting the
 * answer to progress further.
 */

import {StateCard} from 'domain/state_card/state-card.model';
import {Injectable} from '@angular/core';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {ExplorationPlayerStateService} from './exploration-player-state.service';
import {PlayerTranscriptService} from './player-transcript.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MessengerService } from 'services/messenger.service';
import { ServicesConstants } from 'services/services.constants';
import { LoaderService } from 'services/loader.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { VoiceoverPlayerService } from './voiceover-player.service';
import {AppConstants} from 'app.constants';
import { PlayerPositionService } from './player-position.service';
import { LearnerDashboardBackendApiService } from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import { CollectionPlayerBackendApiService } from 'pages/collection-player-page/services/collection-player-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { ContextService } from 'services/context.service';
import { ExplorationEngineService } from './exploration-engine.service';

@Injectable({
  providedIn: 'root',
})
export class ConversationFlowService {
  // If the exploration is iframed, send data to its parent about
  // its height so that the parent can be resized as necessary.
  lastRequestedHeight: number = 0;
  lastRequestedScroll: boolean = false;

  explorationId: string;

  constructor(
    private windowRef: WindowRef,
    private messengerService: MessengerService,
    private explorationEngineService: ExplorationEngineService,
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private loaderService: LoaderService,
    private collectionPlayerBackendApiService: CollectionPlayerBackendApiService,
    private readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService,
    private alertsService: AlertsService,
    private playerPositionService: PlayerPositionService,
    private learnerDashboardBackendApiService: LearnerDashboardBackendApiService,
    private playerTranscriptService: PlayerTranscriptService,
    private contextService: ContextService,
    private voiceoverPlayerService: VoiceoverPlayerService
  ) {}

  adjustPageHeightOnresize(): void {
    this.windowRef.nativeWindow.onresize = () => {
      this.adjustPageHeight(false, null);
    };
  }

  adjustPageHeight(scroll: boolean, callback: () => void): void {
    setTimeout(() => {
      let newHeight = document.body.scrollHeight;
      if (
        Math.abs(this.lastRequestedHeight - newHeight) > 50.5 ||
        (scroll && !this.lastRequestedScroll)
      ) {
        // Sometimes setting iframe height to the exact content height
        // still produces scrollbar, so adding 50 extra px.
        newHeight += 50;
        this.messengerService.sendMessage(
          ServicesConstants.MESSENGER_PAYLOAD.HEIGHT_CHANGE,
          {
            height: newHeight,
            scroll: scroll,
          }
        );
        this.lastRequestedHeight = newHeight;
        this.lastRequestedScroll = scroll;
      }

      if (callback) {
        callback();
      }
    }, 100);
  }

  showQuestionAreNotAvailable(): void {
    this.loaderService.hideLoadingScreen();
  }

  getContentFocusLabel(index: number): string {
    return ExplorationPlayerConstants.CONTENT_FOCUS_LABEL_PREFIX + index;
  }

  getRandomSuffix(): string {
    // This is a bit of a hack. When a refresh to a $scope variable
    // happens,
    // AngularJS compares the new value of the variable to its previous
    // value. If they are the same, then the variable is not updated.
    // Appending a random suffix makes the new value different from the
    // previous one, and thus indirectly forces a refresh.
    let randomSuffix = '';
    let N = Math.round(Math.random() * 1000);
    for (let i = 0; i < N; i++) {
      randomSuffix += ' ';
    }
    return randomSuffix;
  }

  returnToExplorationAfterConceptCard(): void {
    this.playerTranscriptService.addPreviousCard();
    let numCards = this.playerTranscriptService.getNumCards();
    this.playerPositionService.setDisplayedCardIndex(numCards - 1);
  }

  fetchCollectionSummary(collectionId: string): string[] | null {
    let collectionSummary = null;
    this.collectionPlayerBackendApiService
    .fetchCollectionSummariesAsync(collectionId)
    .then(
      response => {
        collectionSummary = response.summaries[0];
      },
      () => {
        this.alertsService.addWarning(
          'There was an error while fetching the collection ' + 'summary.'
        );
      }
    );
    return collectionSummary;
  }

  setActiveVoiceover(feedbackHtml: string, displayedCard: StateCard): void {
    let interaction = displayedCard.getInteraction();

    let feedbackContentId =
      interaction.getContentIdForMatchingHtml(feedbackHtml);

    if (feedbackContentId) {
      this.voiceoverPlayerService.setActiveVoiceover(feedbackContentId);
    }
  }

  doesCollectionAllowsGuestProgress(collectionId: string | never): boolean {
    let allowedCollectionIds =
      AppConstants.ALLOWED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS;
    return (
      (allowedCollectionIds as readonly []).indexOf(collectionId as never) !==
      -1
    );
  }

  fetchCompletedChaptersCount(): number {
    let completedChaptersCount = 0;
    this.learnerDashboardBackendApiService
      .fetchLearnerCompletedChaptersCountDataAsync()
      .then(data => {
        completedChaptersCount = data.completedChaptersCount;
      });
    return completedChaptersCount;
  }

  addNewCard(newCard: StateCard): void {
    this.playerTranscriptService.addNewCard(newCard);
    const explorationLanguageCode =
      this.explorationPlayerStateService.getLanguageCode();
    const selectedLanguageCode =
      this.contentTranslationLanguageService.getCurrentContentLanguageCode();
    if (explorationLanguageCode !== selectedLanguageCode) {
      this.contentTranslationManagerService.displayTranslations(
        selectedLanguageCode
      );
    }
  }

  isSupplementalCardNonempty(card: StateCard): boolean {
    return !card.isInteractionInline();
  }
}
