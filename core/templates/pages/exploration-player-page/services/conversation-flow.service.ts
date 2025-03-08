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

@Injectable({
  providedIn: 'root',
})
export class ConversationFlowService {
  // If the exploration is iframed, send data to its parent about
  // its height so that the parent can be resized as necessary.
  lastRequestedHeight: number = 0;
  lastRequestedScroll: boolean = false;

  constructor(
    private windowRef: WindowRef,
    private messengerService: MessengerService,
    private contentTranslationLanguageService: ContentTranslationLanguageService,
    private contentTranslationManagerService: ContentTranslationManagerService,
    private explorationPlayerStateService: ExplorationPlayerStateService,
    private playerTranscriptService: PlayerTranscriptService
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
