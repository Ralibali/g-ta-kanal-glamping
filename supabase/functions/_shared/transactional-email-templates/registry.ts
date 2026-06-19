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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'chat-notification': chatNotification,
  'chat-reply': chatReply,
  'cleaning-complete': cleaningComplete,
  'cleaning-schedule-update': cleaningScheduleUpdate,
  'tent-ready-guest': tentReadyGuest,
}
