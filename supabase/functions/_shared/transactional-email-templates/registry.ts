/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as chatNotification } from './chat-notification.tsx'
import { template as chatReply } from './chat-reply.tsx'
import { template as cleaningComplete } from './cleaning-complete.tsx'
import { template as cleaningScheduleUpdate } from './cleaning-schedule-update.tsx'
import { template as tentReadyGuest } from './tent-ready-guest.tsx'
import { template as prearrivalOffer } from './prearrival-offer.tsx'
import { template as addonRequestOwner } from './addon-request-owner.tsx'
import { template as addonRequestGuest } from './addon-request-guest.tsx'
import { template as breakfastNewOrder } from './breakfast-new-order.tsx'
import { template as breakfastDigest } from './breakfast-digest.tsx'
import { template as simpleOwnerNotice } from './simple-owner-notice.tsx'


export const TEMPLATES: Record<string, TemplateEntry> = {
  'chat-notification': chatNotification,
  'chat-reply': chatReply,
  'cleaning-complete': cleaningComplete,
  'cleaning-schedule-update': cleaningScheduleUpdate,
  'tent-ready-guest': tentReadyGuest,
  'prearrival-offer': prearrivalOffer,
  'addon-request-owner': addonRequestOwner,
  'addon-request-guest': addonRequestGuest,
  'breakfast-new-order': breakfastNewOrder,
  'breakfast-digest': breakfastDigest,
  'simple-owner-notice': simpleOwnerNotice,
}

